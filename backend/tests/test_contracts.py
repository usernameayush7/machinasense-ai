"""Unit and integration tests for data contracts and validation endpoints."""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError
from starlette.testclient import TestClient

from app.main import app
from app.schemas.telemetry import TelemetryPacket, IndustrialSensors
from app.schemas.alert import (
    MaintenanceAlert,
    AlertSeverity,
    AlertStatus,
    AnomalyEvidence,
    FaultType,
)
from app.schemas.machine import MachineSummary, MachineHealthState

client = TestClient(app)


def test_health_check_endpoint():
    """Verify /health returns 200 OK and valid status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "MachinaSense" in data["service"]


def test_telemetry_schema_valid():
    """Verify valid telemetry packet passes schema validation."""
    packet = TelemetryPacket(
        machine_id="CNC_01",
        timestamp=datetime.now(timezone.utc),
        operating_mode="HIGH_LOAD",
        sensors=IndustrialSensors(
            vibration_x_rms=1.2,
            vibration_y_rms=1.5,
            vibration_z_rms=0.9,
            bearing_temperature_c=65.0,
            motor_current_a=15.2,
            rotational_speed_rpm=1800.0,
            acoustic_emission_db=76.0,
            custom_metrics={"oil_pressure_bar": 4.5}
        )
    )
    assert packet.machine_id == "CNC_01"
    assert packet.sensors.bearing_temperature_c == 65.0
    assert packet.sensors.custom_metrics["oil_pressure_bar"] == 4.5


def test_telemetry_schema_invalid():
    """Verify empty sensor dictionary or invalid type raises a ValidationError."""
    with pytest.raises(ValidationError):
        # Empty sensors payload
        TelemetryPacket(
            machine_id="CNC_01",
            sensors={}  # type: ignore
        )


def test_telemetry_empty_machine_id():
    """Verify empty machine_id is rejected."""
    with pytest.raises(ValidationError):
        TelemetryPacket(
            machine_id="",  # min_length=1
            sensors=IndustrialSensors(
                vibration_x_rms=1.0,
                vibration_y_rms=1.0,
                bearing_temperature_c=50.0,
                motor_current_a=10.0
            )
        )


def test_alert_schema_evidence_and_lead_time():
    """Verify maintenance alert schema captures evidence and early warning lead time."""
    evidence = AnomalyEvidence(
        sensor_name="vibration_x_rms",
        observed_value=3.5,
        baseline_mean=1.2,
        baseline_std=0.3,
        z_score=7.67,
        contribution_pct=75.0,
        unit="g",
        description="Severe radial vibration excursion detected."
    )
    alert = MaintenanceAlert(
        alert_id="ALT-101",
        machine_id="CNC_01",
        timestamp=datetime.now(timezone.utc),
        severity=AlertSeverity.CRITICAL,
        status=AlertStatus.ACTIVE,
        fault_type=FaultType.BEARING_INNER_RACE_FAULT.value,
        confidence=0.95,
        early_warning_lead_time_sec=600.0,
        sensor_evidence=[evidence],
        root_cause_explanation="Bearing inner race degradation detected with high vibration spike.",
        recommended_action="Emergency shutdown and replace bearing cage.",
        estimated_remaining_useful_life_hours=12.0
    )
    assert alert.severity == AlertSeverity.CRITICAL
    assert alert.early_warning_lead_time_sec == 600.0
    assert len(alert.sensor_evidence) == 1
    assert alert.sensor_evidence[0].contribution_pct == 75.0


def test_api_telemetry_validate_endpoint():
    """Test POST /api/v1/telemetry/validate with valid and invalid payloads."""
    valid_payload = {
        "machine_id": "MILL_TEST_01",
        "timestamp": "2026-10-14T23:30:00Z",
        "operating_mode": "NORMAL",
        "sensors": {
            "vibration_x_rms": 1.45,
            "vibration_y_rms": 1.62,
            "bearing_temperature_c": 62.5,
            "motor_current_a": 14.2
        }
    }
    response = client.post("/api/v1/telemetry/validate", json=valid_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["valid"] is True
    assert res_data["machine_id"] == "MILL_TEST_01"
    assert res_data["sensor_count"] == 4

    # Test invalid payload (empty sensors payload)
    invalid_payload = {
        "machine_id": "MILL_TEST_01",
        "sensors": {}
    }
    invalid_response = client.post("/api/v1/telemetry/validate", json=invalid_payload)
    assert invalid_response.status_code == 422


def test_api_alerts_mock_endpoint():
    """Test GET /api/v1/alerts/mock produces compliant MaintenanceAlert structure."""
    response = client.get("/api/v1/alerts/mock")
    assert response.status_code == 200
    alert_data = response.json()
    assert alert_data["alert_id"] == "ALT-DEMO-001"
    assert alert_data["severity"] in ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(alert_data["sensor_evidence"]) > 0
    assert "early_warning_lead_time_sec" in alert_data
    assert "recommended_action" in alert_data


def test_api_machines_mock_endpoint():
    """Test GET /api/v1/machines/mock produces list of MachineSummary objects."""
    response = client.get("/api/v1/machines/mock")
    assert response.status_code == 200
    machines = response.json()
    assert isinstance(machines, list)
    assert len(machines) >= 1
    assert "health_score" in machines[0]
    assert "health_state" in machines[0]
