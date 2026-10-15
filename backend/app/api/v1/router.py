"""API v1 router for MachinaSense backend."""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, status, HTTPException
import httpx
from app.schemas.telemetry import TelemetryPacket, TelemetryValidationResponse
from app.schemas.alert import (
    MaintenanceAlert,
    AlertSeverity,
    AlertStatus,
    AnomalyEvidence,
    FaultType,
)
from app.schemas.machine import MachineSummary, MachineHealthState

api_v1_router = APIRouter()
class MLPredictionRequest(BaseModel):
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float
@api_v1_router.post("/ml/predict")
async def predict_with_ml(readings: MLPredictionRequest):
    sensor_data = {
        "Air temperature [K]": readings.air_temperature,
        "Process temperature [K]": readings.process_temperature,
        "Rotational speed [rpm]": readings.rotational_speed,
        "Torque [Nm]": readings.torque,
        "Tool wear [min]": readings.tool_wear,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "http://127.0.0.1:8001/predict",
                json=sensor_data,
            )

        response.raise_for_status()
        return response.json()

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail="The ML API returned an error.",
        ) from exc

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to the ML API.",
        ) from exc

@api_v1_router.post(
    "/telemetry/validate",
    response_model=TelemetryValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Telemetry Packet",
    description="Validates incoming sensor telemetry against the industrial schema.",
)
async def validate_telemetry(packet: TelemetryPacket) -> TelemetryValidationResponse:
    """Validate telemetry schema and report extracted sensor counts."""
    # Count provided sensors (both core and custom)
    sensor_dict = packet.sensors.model_dump(exclude_none=True)
    custom_metrics = sensor_dict.pop("custom_metrics", {})
    total_sensor_count = len(sensor_dict) + len(custom_metrics)

    return TelemetryValidationResponse(
        valid=True,
        machine_id=packet.machine_id,
        timestamp=packet.timestamp,
        sensor_count=total_sensor_count,
        message=f"Telemetry packet for machine '{packet.machine_id}' is structurally valid with {total_sensor_count} active signals."
    )


@api_v1_router.get(
    "/alerts/mock",
    response_model=MaintenanceAlert,
    status_code=status.HTTP_200_OK,
    summary="Get Sample Mock Alert",
    description="Returns a realistic, evidence-backed mock alert for frontend development.",
)
async def get_mock_alert() -> MaintenanceAlert:
    """Generate a sample evidence-backed alert for frontend integration."""
    now = datetime.now(timezone.utc)
    evidence: List[AnomalyEvidence] = [
        AnomalyEvidence(
            sensor_name="vibration_y_rms",
            observed_value=3.42,
            baseline_mean=1.45,
            baseline_std=0.25,
            z_score=7.88,
            contribution_pct=64.2,
            unit="g",
            description="Radial vibration Y-axis is 7.88 standard deviations above normal baseline."
        ),
        AnomalyEvidence(
            sensor_name="bearing_temperature_c",
            observed_value=76.8,
            baseline_mean=58.2,
            baseline_std=3.1,
            z_score=6.0,
            contribution_pct=25.8,
            unit="°C",
            description="Bearing housing temperature is elevated by 18.6°C over operating baseline."
        ),
        AnomalyEvidence(
            sensor_name="acoustic_emission_db",
            observed_value=84.5,
            baseline_mean=74.0,
            baseline_std=2.2,
            z_score=4.77,
            contribution_pct=10.0,
            unit="dB",
            description="High-frequency acoustic emissions indicate friction in inner raceway."
        )
    ]

    return MaintenanceAlert(
        alert_id="ALT-DEMO-001",
        machine_id="CNC_MILL_01",
        timestamp=now,
        severity=AlertSeverity.HIGH,
        status=AlertStatus.ACTIVE,
        fault_type=FaultType.BEARING_INNER_RACE_FAULT.value,
        confidence=0.92,
        early_warning_lead_time_sec=480.0,
        sensor_evidence=evidence,
        root_cause_explanation="Synchronized spike in radial vibration and thermal dissipation signature matches inner-race bearing degradation pattern.",
        recommended_action="Schedule maintenance within 4 hours. Inspect bearing lubrication and check spindle balance.",
        estimated_time_to_inspection_hours=4.0,
        estimated_remaining_useful_life_hours=36.0
    )


@api_v1_router.get(
    "/machines/mock",
    response_model=List[MachineSummary],
    status_code=status.HTTP_200_OK,
    summary="Get Mock Fleet Machine Statuses",
    description="Returns sample equipment statuses for fleet dashboard rendering.",
)
async def get_mock_machines() -> List[MachineSummary]:
    """Return mock fleet equipment for frontend UI development."""
    now = datetime.now(timezone.utc)
    return [
        MachineSummary(
            machine_id="CNC_MILL_01",
            name="CNC Milling Machine #1",
            type="CNC Mill",
            health_state=MachineHealthState.DEGRADED,
            health_score=68.5,
            last_telemetry_timestamp=now,
            active_alerts_count=1,
            operating_mode="HIGH_LOAD"
        ),
        MachineSummary(
            machine_id="PUMP_MAIN_02",
            name="Primary Coolant Pump",
            type="Centrifugal Pump",
            health_state=MachineHealthState.HEALTHY,
            health_score=96.2,
            last_telemetry_timestamp=now,
            active_alerts_count=0,
            operating_mode="NORMAL"
        ),
        MachineSummary(
            machine_id="MOTOR_SPINDLE_03",
            name="Spindle Drive Motor",
            type="Induction Motor",
            health_state=MachineHealthState.HEALTHY,
            health_score=91.0,
            last_telemetry_timestamp=now,
            active_alerts_count=0,
            operating_mode="NORMAL"
        )
    ]


# ---------------------------------------------------------------------------
# Telemetry Ingestion & Sliding Buffer Endpoints (Sprint 2)
# ---------------------------------------------------------------------------

@api_v1_router.post(
    "/telemetry/ingest",
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Telemetry Packet",
    description="Ingests a real-time telemetry sample into the machine's in-memory sliding buffer.",
)
async def ingest_telemetry(packet: TelemetryPacket) -> dict:
    """Ingest packet into in-memory sliding buffer."""
    from app.services.buffer_manager import buffer_manager

    buffer_manager.push(packet)
    buf = buffer_manager.get_buffer(packet.machine_id)
    buffer_len = len(buf) if buf else 0

    return {
        "status": "ingested",
        "machine_id": packet.machine_id,
        "timestamp": packet.timestamp.isoformat(),
        "current_buffer_size": buffer_len,
    }


@api_v1_router.get(
    "/telemetry/buffer/{machine_id}",
    summary="Get Machine Buffer Telemetry",
    description="Returns the most recent N packets stored in the in-memory sliding buffer for a machine.",
)
async def get_machine_buffer(machine_id: str, limit: int = 50) -> dict:
    """Retrieve recent telemetry packets for a machine."""
    from app.services.buffer_manager import buffer_manager

    buf = buffer_manager.get_buffer(machine_id)
    if not buf:
        return {
            "machine_id": machine_id,
            "sample_count": 0,
            "packets": [],
        }

    all_packets = buf.get_all()
    recent_packets = all_packets[-limit:] if limit > 0 else all_packets

    return {
        "machine_id": machine_id,
        "total_buffer_count": len(all_packets),
        "returned_count": len(recent_packets),
        "packets": [p.model_dump() for p in recent_packets],
    }


@api_v1_router.get(
    "/telemetry/buffer/{machine_id}/stats",
    summary="Get Rolling Window Statistics",
    description="Calculates RMS, mean, std, peak-to-peak, and kurtosis across the sliding window.",
)
async def get_buffer_stats(machine_id: str) -> dict:
    """Calculate rolling statistical features for the given machine."""
    from app.services.buffer_manager import buffer_manager

    buf = buffer_manager.get_buffer(machine_id)
    if not buf or len(buf) == 0:
        return {
            "machine_id": machine_id,
            "sample_count": 0,
            "stats": {},
            "message": "Buffer is empty for this machine."
        }

    return {
        "machine_id": machine_id,
        "sample_count": len(buf),
        "stats": buf.get_stats(),
    }


# ---------------------------------------------------------------------------
# Telemetry Streamer & Dataset Simulation Endpoints (Sprint 2)
# ---------------------------------------------------------------------------

@api_v1_router.post(
    "/simulation/start",
    summary="Start Telemetry Simulation / Playback",
    description="Starts replaying a dataset into the backend buffer at the specified speed multiplier.",
)
async def start_simulation(
    dataset_path: str = "data/sample_bearing_degradation.csv",
    speed_multiplier: float = 1.0,
    loop_infinite: bool = False,
) -> dict:
    """Start or restart the telemetry streaming service."""
    import os
    from app.services.telemetry_streamer import telemetry_streamer
    from app.services.dataset_generator import load_dataset_from_csv, generate_run_to_failure_dataset

    if telemetry_streamer.is_running:
        return {
            "status": "already_running",
            "message": "Simulation is already active.",
            "progress": telemetry_streamer.progress,
        }

    # Ensure dataset exists; generate if missing
    if not os.path.exists(dataset_path):
        os.makedirs(os.path.dirname(os.path.abspath(dataset_path)), exist_ok=True)
        generate_run_to_failure_dataset(total_samples=300, save_csv_path=dataset_path)

    packets = load_dataset_from_csv(dataset_path)
    await telemetry_streamer.start(
        packets=packets,
        speed_multiplier=speed_multiplier,
        loop_infinite=loop_infinite,
    )

    return {
        "status": "started",
        "dataset_path": dataset_path,
        "total_packets": len(packets),
        "speed_multiplier": speed_multiplier,
        "loop_infinite": loop_infinite,
    }


@api_v1_router.post(
    "/simulation/stop",
    summary="Stop Telemetry Simulation",
    description="Stops playback and resets streamer progress.",
)
async def stop_simulation() -> dict:
    """Stop the running simulation."""
    from app.services.telemetry_streamer import telemetry_streamer
    await telemetry_streamer.stop()
    return {"status": "stopped", "message": "Simulation stopped."}


@api_v1_router.post(
    "/simulation/pause",
    summary="Pause Telemetry Simulation",
)
async def pause_simulation() -> dict:
    """Pause the running simulation."""
    from app.services.telemetry_streamer import telemetry_streamer
    await telemetry_streamer.pause()
    return {"status": "paused", "progress": telemetry_streamer.progress}


@api_v1_router.post(
    "/simulation/resume",
    summary="Resume Telemetry Simulation",
)
async def resume_simulation() -> dict:
    """Resume a paused simulation."""
    from app.services.telemetry_streamer import telemetry_streamer
    await telemetry_streamer.resume()
    return {"status": "resumed", "progress": telemetry_streamer.progress}


@api_v1_router.get(
    "/simulation/status",
    summary="Get Simulation Playback Status",
    description="Returns current progress, active state, playback speed, and sample index.",
)
async def get_simulation_status() -> dict:
    """Get current simulation status."""
    from app.services.telemetry_streamer import telemetry_streamer
    return telemetry_streamer.progress


# ---------------------------------------------------------------------------
# Robustness & Complication Handling Endpoints (Sprint 3)
# ---------------------------------------------------------------------------

class FaultInjectionConfigRequest(BaseModel):
    """Dynamic configuration model for simulating industrial sensor complications."""
    enabled: Optional[bool] = None
    packet_drop_rate: Optional[float] = None
    missing_sensor_prob: Optional[float] = None
    noise_sigma: Optional[float] = None
    transient_spike_prob: Optional[float] = None


@api_v1_router.post(
    "/robustness/inject-config",
    summary="Configure Fault & Complication Injection",
    description="Dynamically configure noise level, packet drop rate, and missing sample injection for judge demonstrations.",
)
async def configure_fault_injection(
    config_req: FaultInjectionConfigRequest,
) -> dict:
    """Update fault injection parameters."""
    from app.services.fault_injector import fault_injector

    config = fault_injector.configure(
        enabled=config_req.enabled,
        packet_drop_rate=config_req.packet_drop_rate,
        missing_sensor_prob=config_req.missing_sensor_prob,
        noise_sigma=config_req.noise_sigma,
        transient_spike_prob=config_req.transient_spike_prob,
    )
    return {"status": "configured", "injection_config": config}


@api_v1_router.get(
    "/robustness/status",
    summary="Get Robustness & Imputation Audit Metrics",
    description="Returns live statistics on repaired missing samples, suppressed spikes, and packet drop counts.",
)
async def get_robustness_status() -> dict:
    """Return audit metrics demonstrating system robustness."""
    from app.services.fault_injector import fault_injector
    from app.services.preprocessor import robustness_preprocessor

    return {
        "fault_injector": fault_injector.get_config(),
        "preprocessor_metrics": dict(robustness_preprocessor.metrics),
    }


@api_v1_router.post(
    "/robustness/clean",
    summary="Test Clean Single Telemetry Packet",
    description="Demonstrates on-the-fly missing data imputation and noise suppression for a given packet.",
)
async def clean_single_packet(packet: TelemetryPacket) -> dict:
    """Sanitize dirty packet and return before-and-after audit breakdown."""
    from app.services.preprocessor import robustness_preprocessor

    cleaned_packet, audit_trail = robustness_preprocessor.clean_packet(packet)
    return {
        "original_sensors": packet.sensors.model_dump(),
        "cleaned_sensors": cleaned_packet.sensors.model_dump(),
        "audit_trail": audit_trail,
    }


@api_v1_router.post(
    "/robustness/reset",
    summary="Reset Robustness State & Audit Counters",
)
async def reset_robustness_metrics() -> dict:
    """Reset fault injection and preprocessor metrics."""
    from app.services.fault_injector import fault_injector
    from app.services.preprocessor import robustness_preprocessor

    fault_injector.reset_metrics()
    robustness_preprocessor.reset_state()
    return {"status": "reset", "message": "Preprocessor state and fault injection counters reset."}


# ---------------------------------------------------------------------------
# Inference Engine & Alert Management Endpoints (Sprint 4)
# ---------------------------------------------------------------------------

@api_v1_router.get(
    "/alerts/active",
    response_model=List[MaintenanceAlert],
    summary="Get Active Maintenance Alerts",
    description="Returns all currently active, unresolved maintenance alerts across monitored machines.",
)
async def get_active_alerts(machine_id: Optional[str] = None) -> List[MaintenanceAlert]:
    """Retrieve active alerts with sensor evidence and priority indicators."""
    from app.services.alert_engine import alert_engine
    return alert_engine.get_active_alerts(machine_id=machine_id)


@api_v1_router.get(
    "/alerts/history",
    response_model=List[MaintenanceAlert],
    summary="Get Historical Maintenance Alerts",
    description="Returns audit trail of past triggered alerts, filterable by machine and severity.",
)
async def get_alert_history(
    machine_id: Optional[str] = None,
    severity: Optional[AlertSeverity] = None,
    limit: int = 50,
) -> List[MaintenanceAlert]:
    """Retrieve historical alert log."""
    from app.services.alert_engine import alert_engine
    return alert_engine.get_alert_history(machine_id=machine_id, severity=severity, limit=limit)


@api_v1_router.post(
    "/alerts/{alert_id}/acknowledge",
    summary="Acknowledge Alert Ticket",
    description="Allows plant operators to acknowledge an active alert.",
)
async def acknowledge_alert(alert_id: str) -> dict:
    """Acknowledge alert by ID."""
    from app.services.alert_engine import alert_engine

    alert = alert_engine.acknowledge_alert(alert_id)
    if not alert:
        return {"status": "not_found", "message": f"Alert '{alert_id}' not found in active alerts."}
    return {"status": "acknowledged", "alert_id": alert_id, "alert": alert.model_dump()}


@api_v1_router.post(
    "/alerts/{alert_id}/resolve",
    summary="Resolve Alert Ticket",
    description="Marks an alert as resolved and removes it from the active alert queue.",
)
async def resolve_alert(alert_id: str) -> dict:
    """Resolve alert by ID."""
    from app.services.alert_engine import alert_engine

    alert = alert_engine.resolve_alert(alert_id)
    if not alert:
        return {"status": "not_found", "message": f"Alert '{alert_id}' not found in active alerts."}
    return {"status": "resolved", "alert_id": alert_id, "alert": alert.model_dump()}


@api_v1_router.post(
    "/inference/evaluate/{machine_id}",
    summary="Manually Trigger Anomaly Inference",
    description="Runs statistical and physics-informed anomaly detection on the machine's current sliding window.",
)
async def evaluate_machine_inference(machine_id: str) -> dict:
    """Evaluate machine buffer and generate alert if anomalous."""
    from app.services.inference_engine import inference_engine
    from app.services.alert_engine import alert_engine

    eval_result = inference_engine.evaluate_machine(machine_id)
    alert = alert_engine.process_evaluation(eval_result)

    return {
        "evaluation": eval_result.to_dict(),
        "alert_triggered": alert is not None,
        "alert": alert.model_dump() if alert else None,
    }


@api_v1_router.get(
    "/inference/health-score/{machine_id}",
    summary="Get Machine Health Score & Anomaly Index",
    description="Returns current health score (0-100), anomaly index, and ranked sensor evidence.",
)
async def get_machine_health(machine_id: str) -> dict:
    """Query health score and explainable evidence breakdown for frontend dashboards."""
    from app.services.inference_engine import inference_engine

    eval_result = inference_engine.evaluate_machine(machine_id)
    return {
        "machine_id": machine_id,
        "health_score": round(eval_result.health_score, 2),
        "anomaly_score": round(eval_result.anomaly_score, 4),
        "is_anomalous": eval_result.is_anomalous,
        "dominant_sensor": eval_result.dominant_sensor,
        "estimated_rul_hours": eval_result.estimated_rul_hours,
        "sensor_evidence": [e.model_dump() for e in eval_result.sensor_evidence],
    }


# ---------------------------------------------------------------------------
# Persistent Storage Endpoints (Sprint 5)
# ---------------------------------------------------------------------------

@api_v1_router.get(
    "/storage/alerts",
    summary="Get Persisted Alerts from SQLite",
    description="Query persistent historical alerts with status and severity filters.",
)
async def get_persisted_alerts(
    machine_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[dict]:
    """Retrieve historical alerts stored in SQLite WAL database."""
    from app.services.storage import storage_service
    return storage_service.get_alerts(
        machine_id=machine_id,
        severity=severity,
        status=status,
        limit=limit,
    )


@api_v1_router.get(
    "/storage/telemetry/{machine_id}",
    summary="Get Persisted Telemetry Logs",
    description="Retrieve historical time-series sensor points logged to SQLite for charting.",
)
async def get_persisted_telemetry(machine_id: str, limit: int = 100) -> List[dict]:
    """Retrieve logged telemetry history for a specific machine asset."""
    from app.services.storage import storage_service
    return storage_service.get_telemetry_history(machine_id=machine_id, limit=limit)


# ---------------------------------------------------------------------------
# Deployment Efficiency & System Metrics Endpoints (Sprint 6)
# ---------------------------------------------------------------------------

@api_v1_router.get(
    "/system/metrics",
    summary="Get System Profiling & Edge Deployment Metrics",
    description="Returns RAM footprint (MB), CPU utilization, and inference latency percentiles (p50, p95, p99).",
)
async def get_system_metrics() -> dict:
    """Collect runtime compute, memory, and latency metrics."""
    from app.services.benchmarker import benchmarker
    return benchmarker.get_system_metrics()


@api_v1_router.post(
    "/system/benchmark",
    summary="Trigger Edge Stress Benchmark",
    description="Executes rapid multi-iteration inference benchmark to measure throughput and latency percentiles.",
)
async def trigger_benchmark_stress_test(iterations: int = 100) -> dict:
    """Run an on-demand stress benchmark against sliding windows."""
    from app.services.benchmarker import benchmarker
    return benchmarker.run_benchmark_stress_test(iterations=iterations)





