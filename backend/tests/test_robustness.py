"""Unit and integration tests for Sprint 3: Robustness, Imputation, and Fault Injection."""

import pytest
from datetime import datetime, timezone
from starlette.testclient import TestClient

from app.main import app
from app.schemas.telemetry import TelemetryPacket, IndustrialSensors
from app.services.preprocessor import RobustnessPreprocessor, PHYSICAL_DEFAULTS
from app.services.fault_injector import FaultInjector

client = TestClient(app)


def test_first_packet_missing_value_fallback():
    """Verify that if the very first packet has missing/None values, physical defaults are used."""
    preprocessor = RobustnessPreprocessor()
    # Packet with None values on first sight
    raw_packet = TelemetryPacket(
        machine_id="NEW_MACHINE_01",
        operating_mode="NORMAL",
        sensors=IndustrialSensors(
            vibration_x_rms=1.5,
            vibration_y_rms=1.5,
            bearing_temperature_c=60.0,
            motor_current_a=12.0,
            acoustic_emission_db=None,  # Missing
            rotational_speed_rpm=None,  # Missing
        )
    )

    cleaned_packet, audit = preprocessor.clean_packet(raw_packet)

    assert "acoustic_emission_db" in audit["imputed_sensors"]
    assert "rotational_speed_rpm" in audit["imputed_sensors"]
    assert cleaned_packet.sensors.acoustic_emission_db == PHYSICAL_DEFAULTS["acoustic_emission_db"]
    assert cleaned_packet.sensors.rotational_speed_rpm == PHYSICAL_DEFAULTS["rotational_speed_rpm"]


def test_subsequent_packet_imputation_from_last_valid():
    """Verify missing values in subsequent packets are forward-filled from last valid reading."""
    preprocessor = RobustnessPreprocessor()
    # First packet: valid values
    p1 = TelemetryPacket(
        machine_id="M_IMPUTE",
        sensors=IndustrialSensors(
            vibration_x_rms=2.35,
            vibration_y_rms=2.40,
            bearing_temperature_c=68.5,
            motor_current_a=15.0
        )
    )
    preprocessor.clean_packet(p1)

    # Second packet: bearing temperature dropped
    p2 = TelemetryPacket(
        machine_id="M_IMPUTE",
        sensors=IndustrialSensors(
            vibration_x_rms=2.36,
            vibration_y_rms=2.41,
            bearing_temperature_c=None,  # Sensor drop
            motor_current_a=15.1
        )
    )
    cleaned_p2, audit = preprocessor.clean_packet(p2)

    assert "bearing_temperature_c" in audit["imputed_sensors"]
    # Should be close to p1 value (subject to EWMA smoothing)
    assert cleaned_p2.sensors.bearing_temperature_c is not None
    assert abs(cleaned_p2.sensors.bearing_temperature_c - 68.5) < 1.0


def test_outlier_spike_suppression():
    """Verify extreme single-sample spikes (electrical bounce) are clipped."""
    preprocessor = RobustnessPreprocessor(outlier_z_threshold=4.0)
    machine_id = "M_SPIKE"

    # Send 5 normal baseline packets
    for _ in range(5):
        p = TelemetryPacket(
            machine_id=machine_id,
            sensors=IndustrialSensors(
                vibration_x_rms=1.2,
                vibration_y_rms=1.3,
                bearing_temperature_c=55.0,
                motor_current_a=12.0
            )
        )
        preprocessor.clean_packet(p)

    # Send an extreme outlier (10x spike)
    spike_packet = TelemetryPacket(
        machine_id=machine_id,
        sensors=IndustrialSensors(
            vibration_x_rms=15.0,  # Unphysical spike
            vibration_y_rms=1.3,
            bearing_temperature_c=55.0,
            motor_current_a=12.0
        )
    )
    cleaned_spike, audit = preprocessor.clean_packet(spike_packet)

    assert len(audit["suppressed_spikes"]) >= 1
    assert audit["suppressed_spikes"][0]["sensor"] == "vibration_x_rms"
    # Cleaned value must be significantly lower than raw 15.0g
    assert cleaned_spike.sensors.vibration_x_rms < 5.0


def test_fault_injector_packet_drop_and_noise():
    """Verify fault injector drops packets and adds Gaussian noise."""
    injector = FaultInjector(
        enabled=True,
        packet_drop_rate=1.0,  # 100% drop
    )
    p = TelemetryPacket(
        machine_id="M_DROP",
        sensors=IndustrialSensors(
            vibration_x_rms=1.0,
            vibration_y_rms=1.0,
            bearing_temperature_c=50.0,
            motor_current_a=10.0
        )
    )

    # Should be completely dropped
    result = injector.process(p)
    assert result is None
    assert injector.metrics["packets_dropped"] == 1

    # Now test noise injection
    injector.configure(packet_drop_rate=0.0, noise_sigma=0.5)
    result_noise = injector.process(p)
    assert result_noise is not None
    assert result_noise.sensors.vibration_x_rms != 1.0  # Modified by noise
    assert injector.metrics["noise_samples_added"] > 0


def test_end_to_end_corrupt_and_clean_pipeline():
    """End-to-end integration: inject fault, pass through preprocessor, verify result is clean and non-null."""
    injector = FaultInjector(
        enabled=True,
        packet_drop_rate=0.0,
        missing_sensor_prob=0.25,
        noise_sigma=0.1,
    )
    preprocessor = RobustnessPreprocessor()

    p = TelemetryPacket(
        machine_id="M_E2E",
        sensors=IndustrialSensors(
            vibration_x_rms=1.4,
            vibration_y_rms=1.5,
            bearing_temperature_c=58.0,
            motor_current_a=13.0
        )
    )

    corrupted = injector.process(p)
    assert corrupted is not None

    cleaned, audit = preprocessor.clean_packet(corrupted)
    # Even if missing sensors were injected, all cleaned fields must be valid numbers
    assert cleaned.sensors.vibration_x_rms is not None
    assert cleaned.sensors.vibration_y_rms is not None
    assert cleaned.sensors.bearing_temperature_c is not None
    assert cleaned.sensors.motor_current_a is not None


def test_api_robustness_endpoints():
    """Test REST API endpoints for robustness configuration and packet cleaning."""
    # 1. Configure injection
    config_payload = {
        "enabled": True,
        "packet_drop_rate": 0.1,
        "noise_sigma": 0.2,
        "missing_sensor_prob": 0.05
    }
    res_cfg = client.post("/api/v1/robustness/inject-config", json=config_payload)
    assert res_cfg.status_code == 200
    cfg_data = res_cfg.json()["injection_config"]
    assert cfg_data["enabled"] is True
    assert cfg_data["noise_sigma"] == 0.2

    # 2. Query status
    res_status = client.get("/api/v1/robustness/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert "preprocessor_metrics" in status_data
    assert "fault_injector" in status_data

    # 3. Clean single packet via API
    test_packet = {
        "machine_id": "TEST_CLEAN_API",
        "operating_mode": "HIGH_LOAD",
        "sensors": {
            "vibration_x_rms": 1.5,
            "vibration_y_rms": 1.6,
            "bearing_temperature_c": 62.0,
            "motor_current_a": 14.0
        }
    }
    res_clean = client.post("/api/v1/robustness/clean", json=test_packet)
    assert res_clean.status_code == 200
    clean_json = res_clean.json()
    assert "cleaned_sensors" in clean_json
    assert "audit_trail" in clean_json
    assert clean_json["audit_trail"]["operating_regime"] == "HIGH_LOAD"

    # 4. Reset metrics
    res_reset = client.post("/api/v1/robustness/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["status"] == "reset"
