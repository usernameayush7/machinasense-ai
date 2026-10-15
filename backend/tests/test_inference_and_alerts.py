"""Unit and integration tests for Sprint 4: Inference Engine and Explainable Alert Engine."""

import pytest
from datetime import datetime, timezone, timedelta
from starlette.testclient import TestClient

from app.main import app
from app.schemas.telemetry import TelemetryPacket, IndustrialSensors
from app.schemas.alert import AlertSeverity, AlertStatus, FaultType
from app.services.buffer_manager import SlidingBuffer, buffer_manager
from app.services.inference_engine import StatisticalAnomalyDetector, InferenceEngine
from app.services.alert_engine import AlertEngine

client = TestClient(app)


def test_detector_normal_equipment_evaluation():
    """Verify healthy equipment produces low anomaly score and 100% health."""
    detector = StatisticalAnomalyDetector()
    buf = SlidingBuffer(machine_id="M_HEALTHY", max_size=10)

    # Fill with 8 healthy nominal samples
    for _ in range(8):
        buf.append(TelemetryPacket(
            machine_id="M_HEALTHY",
            sensors=IndustrialSensors(
                vibration_x_rms=1.25,
                vibration_y_rms=1.45,
                vibration_z_rms=0.92,
                bearing_temperature_c=56.5,
                motor_current_a=14.0,
                rotational_speed_rpm=1800.0,
                acoustic_emission_db=72.5,
            )
        ))

    result = detector.evaluate_buffer(buf)
    assert not result.is_anomalous
    assert result.health_score > 90.0
    assert result.anomaly_score < 0.20
    assert len(result.sensor_evidence) == 0


def test_detector_bearing_fault_anomaly_and_explainability():
    """Verify bearing degradation triggers anomaly, calculates evidence, and ranks contribution."""
    detector = StatisticalAnomalyDetector()
    buf = SlidingBuffer(machine_id="M_FAULT", max_size=10)

    # Fill with degraded bearing readings (sharp vibration spike and acoustic elevation)
    for _ in range(8):
        buf.append(TelemetryPacket(
            machine_id="M_FAULT",
            sensors=IndustrialSensors(
                vibration_x_rms=3.5,     # High Z-score
                vibration_y_rms=4.2,     # Very high Z-score
                bearing_temperature_c=78.0, # Elevated
                motor_current_a=16.5,
                acoustic_emission_db=86.0  # Elevated acoustic
            )
        ))

    result = detector.evaluate_buffer(buf)
    assert result.is_anomalous
    assert result.anomaly_score > 0.80
    assert result.health_score < 20.0
    assert result.fault_type == FaultType.BEARING_INNER_RACE_FAULT.value

    # Check evidence explainability
    evidence = result.sensor_evidence
    assert len(evidence) >= 2
    # Dominant sensor should be vibration
    assert "vibration" in result.dominant_sensor

    # Verify contribution percentages sum close to 100%
    total_pct = sum(e.contribution_pct for e in evidence)
    assert abs(total_pct - 100.0) < 1.0


def test_alert_engine_debouncing_persistence():
    """Verify transient single-sample spike is debounced and only sustained anomaly triggers alert."""
    engine = AlertEngine(persistence_threshold=3)
    detector = StatisticalAnomalyDetector()

    buf = SlidingBuffer(machine_id="M_DEBOUNCE", max_size=10)

    # Normal samples
    for _ in range(6):
        buf.append(TelemetryPacket(
            machine_id="M_DEBOUNCE",
            sensors=IndustrialSensors(
                vibration_x_rms=1.25,
                vibration_y_rms=1.45,
                bearing_temperature_c=56.5,
                motor_current_a=14.0,
            )
        ))

    # Single anomalous sample pushed
    buf.append(TelemetryPacket(
        machine_id="M_DEBOUNCE",
        sensors=IndustrialSensors(
            vibration_x_rms=4.5,
            vibration_y_rms=4.8,
            bearing_temperature_c=80.0,
            motor_current_a=18.0,
        )
    ))

    # Evaluation 1: Should NOT trigger alert yet (count=1, threshold=3)
    res1 = detector.evaluate_buffer(buf)
    alert1 = engine.process_evaluation(res1)
    assert alert1 is None

    # Evaluation 2: Should NOT trigger alert yet (count=2, threshold=3)
    alert2 = engine.process_evaluation(res1)
    assert alert2 is None

    # Evaluation 3: Sustained anomaly -> Alert MUST trigger!
    alert3 = engine.process_evaluation(res1)
    assert alert3 is not None
    assert alert3.machine_id == "M_DEBOUNCE"
    assert alert3.severity in [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
    assert alert3.recommended_action != ""


def test_alert_lifecycle_acknowledge_and_resolve():
    """Verify alert transitions from ACTIVE -> ACKNOWLEDGED -> RESOLVED."""
    engine = AlertEngine(persistence_threshold=1)
    detector = StatisticalAnomalyDetector()

    buf = SlidingBuffer(machine_id="M_LIFECYCLE", max_size=5)
    for _ in range(5):
        buf.append(TelemetryPacket(
            machine_id="M_LIFECYCLE",
            sensors=IndustrialSensors(
                vibration_x_rms=4.5,
                vibration_y_rms=4.8,
                bearing_temperature_c=80.0,
                motor_current_a=18.0,
            )
        ))

    res = detector.evaluate_buffer(buf)
    alert = engine.process_evaluation(res)
    assert alert is not None
    alert_id = alert.alert_id

    # Check active list
    active = engine.get_active_alerts("M_LIFECYCLE")
    assert len(active) == 1
    assert active[0].alert_id == alert_id

    # Acknowledge
    ack = engine.acknowledge_alert(alert_id)
    assert ack is not None
    assert ack.status == AlertStatus.ACKNOWLEDGED

    # Resolve
    resolved = engine.resolve_alert(alert_id)
    assert resolved is not None
    assert resolved.status == AlertStatus.RESOLVED

    # Check active list is now empty
    active_after = engine.get_active_alerts("M_LIFECYCLE")
    assert len(active_after) == 0


def test_api_inference_and_alert_endpoints():
    """Test REST API endpoints for inference evaluation and alert querying."""
    machine_id = "API_INFER_TEST"

    # Ingest 6 anomalous packets into buffer
    for _ in range(6):
        client.post("/api/v1/telemetry/ingest", json={
            "machine_id": machine_id,
            "sensors": {
                "vibration_x_rms": 4.5,
                "vibration_y_rms": 4.8,
                "bearing_temperature_c": 82.0,
                "motor_current_a": 19.0,
                "acoustic_emission_db": 85.0
            }
        })

    # Trigger manual inference evaluate 3 times to satisfy persistence threshold
    client.post(f"/api/v1/inference/evaluate/{machine_id}")
    client.post(f"/api/v1/inference/evaluate/{machine_id}")
    res_eval = client.post(f"/api/v1/inference/evaluate/{machine_id}")
    assert res_eval.status_code == 200
    eval_json = res_eval.json()
    assert eval_json["alert_triggered"] is True

    # Query health score endpoint
    res_health = client.get(f"/api/v1/inference/health-score/{machine_id}")
    assert res_health.status_code == 200
    health_json = res_health.json()
    assert health_json["is_anomalous"] is True
    assert health_json["health_score"] < 40.0
    assert len(health_json["sensor_evidence"]) > 0

    # Query active alerts
    res_active = client.get(f"/api/v1/alerts/active?machine_id={machine_id}")
    assert res_active.status_code == 200
    active_alerts = res_active.json()
    assert len(active_alerts) >= 1
    alert_id = active_alerts[0]["alert_id"]

    # Acknowledge via API
    res_ack = client.post(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert res_ack.status_code == 200
    assert res_ack.json()["status"] == "acknowledged"

    # Resolve via API
    res_resolve = client.post(f"/api/v1/alerts/{alert_id}/resolve")
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "resolved"
