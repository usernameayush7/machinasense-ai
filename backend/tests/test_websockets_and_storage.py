"""Unit and integration tests for Sprint 5: WebSockets and SQLite WAL Persistence."""

import os
import pytest
from datetime import datetime, timezone
from starlette.testclient import TestClient

from app.main import app
from app.schemas.alert import MaintenanceAlert, AlertSeverity, AlertStatus, AnomalyEvidence, FaultType
from app.schemas.telemetry import TelemetryPacket, IndustrialSensors
from app.services.storage import StorageService
from app.services.websocket_manager import WebSocketManager

client = TestClient(app)


def test_storage_service_alert_crud(tmp_path):
    """Verify SQLite WAL storage correctly inserts, updates, and queries alerts."""
    db_file = str(tmp_path / "test_machinasense.db")
    storage = StorageService(db_path=db_file)
    assert os.path.exists(db_file)

    now = datetime.now(timezone.utc)
    evidence = [
        AnomalyEvidence(
            sensor_name="vibration_y_rms",
            observed_value=3.8,
            baseline_mean=1.45,
            baseline_std=0.18,
            z_score=13.0,
            contribution_pct=85.0,
            unit="g",
            description="Severe radial vibration."
        )
    ]
    alert = MaintenanceAlert(
        alert_id="ALT-STORE-001",
        machine_id="CNC_PERSIST_01",
        timestamp=now,
        severity=AlertSeverity.HIGH,
        status=AlertStatus.ACTIVE,
        fault_type=FaultType.BEARING_INNER_RACE_FAULT.value,
        confidence=0.91,
        early_warning_lead_time_sec=42.0,
        sensor_evidence=evidence,
        root_cause_explanation="Bearing inner raceway spalling.",
        recommended_action="Inspect bearing assembly.",
        estimated_time_to_inspection_hours=4.0,
        estimated_remaining_useful_life_hours=18.0
    )

    # 1. Save alert
    storage.save_alert(alert)

    # 2. Query alerts
    stored = storage.get_alerts(machine_id="CNC_PERSIST_01")
    assert len(stored) == 1
    assert stored[0]["alert_id"] == "ALT-STORE-001"
    assert stored[0]["severity"] == "HIGH"
    assert stored[0]["status"] == "ACTIVE"
    assert len(stored[0]["sensor_evidence"]) == 1

    # 3. Update status to ACKNOWLEDGED
    success_ack = storage.update_alert_status("ALT-STORE-001", AlertStatus.ACKNOWLEDGED)
    assert success_ack is True
    updated = storage.get_alerts(machine_id="CNC_PERSIST_01")
    assert updated[0]["status"] == "ACKNOWLEDGED"

    # 4. Update status to RESOLVED
    success_res = storage.update_alert_status("ALT-STORE-001", AlertStatus.RESOLVED)
    assert success_res is True
    resolved = storage.get_alerts(machine_id="CNC_PERSIST_01", status="RESOLVED")
    assert len(resolved) == 1


def test_storage_service_telemetry_logging(tmp_path):
    """Verify SQLite storage records and retrieves time-series telemetry points."""
    db_file = str(tmp_path / "test_telemetry.db")
    storage = StorageService(db_path=db_file)

    now = datetime.now(timezone.utc)
    for i in range(5):
        storage.log_telemetry(
            machine_id="MACHINE_LOG_01",
            timestamp=now,
            vibration_x_rms=1.2 + i * 0.1,
            vibration_y_rms=1.4 + i * 0.1,
            bearing_temperature_c=55.0 + i,
            motor_current_a=14.0,
            operating_mode="NORMAL"
        )

    history = storage.get_telemetry_history("MACHINE_LOG_01", limit=10)
    assert len(history) == 5
    assert history[0]["machine_id"] == "MACHINE_LOG_01"
    assert history[-1]["vibration_x_rms"] == 1.6


def test_websocket_endpoint_connection():
    """Verify WebSocket endpoint /ws/telemetry connects and receives welcome confirmation."""
    with client.websocket_connect("/ws/telemetry") as websocket:
        welcome = websocket.receive_json()
        assert welcome["event"] == "connection_established"
        assert "MachinaSense" in welcome["message"]
        assert welcome["active_clients"] >= 1

        # Send ping text
        websocket.send_text("ping")


def test_api_storage_endpoints():
    """Test REST API storage endpoints for querying persisted alerts and telemetry."""
    res_alerts = client.get("/api/v1/storage/alerts?limit=5")
    assert res_alerts.status_code == 200
    assert isinstance(res_alerts.json(), list)

    res_telemetry = client.get("/api/v1/storage/telemetry/CNC_MILL_01?limit=5")
    assert res_telemetry.status_code == 200
    assert isinstance(res_telemetry.json(), list)
