"""Unit and integration tests for sliding buffer and telemetry streamer."""

import asyncio
import os
import pytest
from datetime import datetime, timezone
from starlette.testclient import TestClient

from app.main import app
from app.schemas.telemetry import TelemetryPacket, IndustrialSensors
from app.services.buffer_manager import SlidingBuffer, BufferManager
from app.services.dataset_generator import generate_run_to_failure_dataset, load_dataset_from_csv
from app.services.telemetry_streamer import TelemetryStreamer

client = TestClient(app)


def test_sliding_buffer_fifo_eviction():
    """Verify sliding buffer maintains maxlen and evicts oldest items."""
    buf = SlidingBuffer(machine_id="TEST_M1", max_size=3)
    assert len(buf) == 0
    assert not buf.is_full

    for i in range(5):
        packet = TelemetryPacket(
            machine_id="TEST_M1",
            timestamp=datetime.now(timezone.utc),
            sensors=IndustrialSensors(
                vibration_x_rms=float(i),
                vibration_y_rms=float(i * 1.5),
                bearing_temperature_c=50.0 + i,
                motor_current_a=10.0
            )
        )
        buf.append(packet)

    assert len(buf) == 3
    assert buf.is_full
    # Check that oldest samples (0, 1) were dropped and [2, 3, 4] remain
    x_series = buf.get_sensor_series("vibration_x_rms")
    assert list(x_series) == [2.0, 3.0, 4.0]


def test_sliding_buffer_stats_computation():
    """Verify statistics calculation on window buffer."""
    buf = SlidingBuffer(machine_id="TEST_M2", max_size=10)
    # Empty stats test (should not fail or divide by zero)
    assert buf.get_stats() == {}

    for val in [1.0, 2.0, 3.0, 4.0, 5.0]:
        packet = TelemetryPacket(
            machine_id="TEST_M2",
            timestamp=datetime.now(timezone.utc),
            sensors=IndustrialSensors(
                vibration_x_rms=val,
                vibration_y_rms=val * 2.0,
                bearing_temperature_c=60.0,
                motor_current_a=12.0
            )
        )
        buf.append(packet)

    stats = buf.get_stats()
    assert "vibration_x_rms" in stats
    vib_stats = stats["vibration_x_rms"]
    assert vib_stats["mean"] == 3.0
    assert vib_stats["min"] == 1.0
    assert vib_stats["max"] == 5.0
    assert vib_stats["peak_to_peak"] == 4.0
    assert vib_stats["count"] == 5.0


def test_buffer_manager_machine_isolation():
    """Verify BufferManager isolates data between different machines."""
    mgr = BufferManager(default_buffer_size=10)
    p1 = TelemetryPacket(
        machine_id="MACHINE_A",
        sensors=IndustrialSensors(
            vibration_x_rms=1.0,
            vibration_y_rms=1.0,
            bearing_temperature_c=50.0,
            motor_current_a=10.0
        )
    )
    p2 = TelemetryPacket(
        machine_id="MACHINE_B",
        sensors=IndustrialSensors(
            vibration_x_rms=2.0,
            vibration_y_rms=2.0,
            bearing_temperature_c=55.0,
            motor_current_a=12.0
        )
    )

    mgr.push(p1)
    mgr.push(p2)

    buf_a = mgr.get_buffer("MACHINE_A")
    buf_b = mgr.get_buffer("MACHINE_B")

    assert buf_a is not None and len(buf_a) == 1
    assert buf_b is not None and len(buf_b) == 1
    assert buf_a.get_sensor_series("vibration_x_rms")[0] == 1.0
    assert buf_b.get_sensor_series("vibration_x_rms")[0] == 2.0


def test_dataset_generator_and_csv_loader(tmp_path):
    """Test generating run-to-failure dataset and parsing back to TelemetryPackets."""
    csv_file = str(tmp_path / "test_run.csv")
    df = generate_run_to_failure_dataset(
        machine_id="MILL_09",
        total_samples=50,
        sample_interval_sec=0.5,
        save_csv_path=csv_file
    )

    assert os.path.exists(csv_file)
    assert len(df) == 50
    assert "vibration_x_rms" in df.columns
    assert "ground_truth_state" in df.columns
    assert "lead_time_to_failure_sec" in df.columns

    # Test loading back via load_dataset_from_csv
    packets = load_dataset_from_csv(csv_file)
    assert len(packets) == 50
    assert packets[0].machine_id == "MILL_09"
    assert packets[0].sensors.vibration_x_rms > 0
    assert packets[0].metadata["ground_truth_state"] in ["HEALTHY", "INCIPIENT_FAULT", "SEVERE_DEGRADATION", "CRITICAL_FAILURE"]


@pytest.mark.anyio
async def test_telemetry_streamer_async_lifecycle():
    """Verify start, pause, resume, and stop controls on the async streamer."""
    streamer = TelemetryStreamer(base_rate_hz=50.0)  # High rate for fast test
    packets = [
        TelemetryPacket(
            machine_id=f"TEST_ASYNC_{i}",
            sensors=IndustrialSensors(
                vibration_x_rms=1.0,
                vibration_y_rms=1.0,
                bearing_temperature_c=50.0,
                motor_current_a=10.0
            )
        )
        for i in range(10)
    ]

    await streamer.start(packets=packets, speed_multiplier=2.0)
    assert streamer.is_running
    assert not streamer.is_paused

    await streamer.pause()
    assert streamer.is_paused

    await streamer.resume()
    assert not streamer.is_paused

    await streamer.stop()
    assert not streamer.is_running
    assert streamer.progress["current_index"] == 0


def test_api_telemetry_ingest_and_buffer_stats():
    """Test REST API ingestion into buffer and querying stats."""
    payload = {
        "machine_id": "API_MACHINE_01",
        "timestamp": "2026-10-15T02:00:00Z",
        "sensors": {
            "vibration_x_rms": 2.1,
            "vibration_y_rms": 2.8,
            "bearing_temperature_c": 68.0,
            "motor_current_a": 16.5
        }
    }

    # Ingest sample
    res_ingest = client.post("/api/v1/telemetry/ingest", json=payload)
    assert res_ingest.status_code == 201
    assert res_ingest.json()["status"] == "ingested"

    # Query buffer
    res_buf = client.get("/api/v1/telemetry/buffer/API_MACHINE_01")
    assert res_buf.status_code == 200
    assert res_buf.json()["returned_count"] >= 1

    # Query stats
    res_stats = client.get("/api/v1/telemetry/buffer/API_MACHINE_01/stats")
    assert res_stats.status_code == 200
    stats_data = res_stats.json()
    assert "stats" in stats_data
    assert "vibration_x_rms" in stats_data["stats"]


def test_api_simulation_lifecycle():
    """Test REST API simulation start, status, and stop."""
    # Check status initially
    res_status = client.get("/api/v1/simulation/status")
    assert res_status.status_code == 200

    # Start simulation
    res_start = client.post(
        "/api/v1/simulation/start",
        params={"dataset_path": "data/sample_bearing_degradation.csv", "speed_multiplier": 5.0}
    )
    assert res_start.status_code == 200
    start_json = res_start.json()
    assert start_json["status"] in ["started", "already_running"]

    # Stop simulation
    res_stop = client.post("/api/v1/simulation/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "stopped"
