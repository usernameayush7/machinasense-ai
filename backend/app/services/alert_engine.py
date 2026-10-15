"""Alert Engine: Debouncing, severity quantification, lead time calculation, and maintenance actions."""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from collections import defaultdict

from app.schemas.alert import (
    MaintenanceAlert,
    AlertSeverity,
    AlertStatus,
    FaultType,
)
from app.services.inference_engine import AnomalyEvaluationResult

# Prescriptive actions mapped by fault category
MAINTENANCE_ACTION_PLAYBOOK = {
    FaultType.BEARING_INNER_RACE_FAULT.value: (
        "Inspect bearing grease lubrication and check radial spindle balance. "
        "Prepare replacement bearing cage if high-frequency acoustic emission persists."
    ),
    FaultType.BEARING_OUTER_RACE_FAULT.value: (
        "Check bearing housing alignment and bolt torque. Inspect outer raceway for spalling."
    ),
    FaultType.BEARING_BALL_FAULT.value: (
        "Immediate bearing replacement recommended during next shift to avoid catastrophic spindle lockup."
    ),
    FaultType.MOTOR_OVERHEATING.value: (
        "Check motor cooling fan duct for debris. Verify stator winding resistance and supply phase balance."
    ),
    FaultType.MASS_UNBALANCE.value: (
        "Clean rotor/impeller blades and re-calibrate dynamic balancing weights."
    ),
    FaultType.SHAFT_MISALIGNMENT.value: (
        "Perform laser alignment of motor-spindle coupling and verify flexible coupling elastomer."
    ),
    FaultType.LUBRICATION_STARVATION.value: (
        "Replenish high-performance synthetic grease (ISO VG 220) into spindle reservoir immediately."
    ),
    FaultType.GENERIC_ANOMALY.value: (
        "Conduct comprehensive acoustic and vibration diagnostic scan during upcoming scheduled maintenance window."
    ),
}

# Action inspection windows by severity
INSPECTION_WINDOW_HOURS = {
    AlertSeverity.LOW: 48.0,
    AlertSeverity.MEDIUM: 24.0,
    AlertSeverity.HIGH: 4.0,
    AlertSeverity.CRITICAL: 1.0,
}


class AlertEngine:
    """Manages alert triggering, debouncing persistence, early warning lead times, and alert lifecycles."""

    def __init__(self, persistence_threshold: int = 3):
        self.persistence_threshold = persistence_threshold

        # Persistence counters: machine_id -> consecutive anomaly count
        self._consecutive_counts: Dict[str, int] = defaultdict(int)

        # Early warning tracking: machine_id -> datetime of first early warning
        self._first_warning_timestamps: Dict[str, datetime] = {}

        # Alert storage: machine_id -> active MaintenanceAlert
        self._active_alerts: Dict[str, MaintenanceAlert] = {}
        # Historical log of all alerts
        self._alert_history: List[MaintenanceAlert] = []

    def process_evaluation(
        self,
        evaluation: AnomalyEvaluationResult,
        timestamp: Optional[datetime] = None,
    ) -> Optional[MaintenanceAlert]:
        """Process an inference result and evaluate alert triggering."""
        machine_id = evaluation.machine_id
        now = timestamp or datetime.now(timezone.utc)

        # If not anomalous, decay/reset counter
        if not evaluation.is_anomalous:
            self._consecutive_counts[machine_id] = 0
            return None

        # Increment consecutive anomaly counter (debouncing filter)
        self._consecutive_counts[machine_id] += 1
        count = self._consecutive_counts[machine_id]

        # Require persistence to suppress false alarm spikes
        if count < self.persistence_threshold:
            return None

        # Determine severity level
        severity = self._map_severity(evaluation.anomaly_score)

        # Record first warning timestamp for early warning lead time tracking
        if machine_id not in self._first_warning_timestamps:
            self._first_warning_timestamps[machine_id] = now

        first_warning = self._first_warning_timestamps[machine_id]
        lead_time_sec = max(0.0, (now - first_warning).total_seconds())

        # Generate root cause explanation
        dominant = evaluation.dominant_sensor or "vibration"
        root_cause = (
            f"Persistent multi-signal anomaly detected (score: {round(evaluation.anomaly_score, 2)}). "
            f"Dominant symptom observed on {dominant}."
        )

        recommended_action = MAINTENANCE_ACTION_PLAYBOOK.get(
            evaluation.fault_type,
            MAINTENANCE_ACTION_PLAYBOOK[FaultType.GENERIC_ANOMALY.value]
        )

        inspection_window = INSPECTION_WINDOW_HOURS.get(severity, 24.0)

        # Check if an active alert already exists for this machine
        existing_alert = self._active_alerts.get(machine_id)
        if existing_alert and existing_alert.status == AlertStatus.ACTIVE:
            # If severity escalated, update the alert in-place without flooding new tickets
            existing_alert.timestamp = now
            existing_alert.severity = severity
            existing_alert.confidence = round(evaluation.anomaly_score, 2)
            existing_alert.sensor_evidence = evaluation.sensor_evidence
            existing_alert.early_warning_lead_time_sec = round(lead_time_sec, 1)
            existing_alert.fault_type = evaluation.fault_type
            existing_alert.estimated_remaining_useful_life_hours = evaluation.estimated_rul_hours

            # Sync update to persistent storage
            from app.services.storage import storage_service
            storage_service.save_alert(existing_alert)
            return existing_alert

        # Construct new MaintenanceAlert
        alert_id = f"ALT-{machine_id[:8]}-{uuid.uuid4().hex[:6].upper()}"
        alert = MaintenanceAlert(
            alert_id=alert_id,
            machine_id=machine_id,
            timestamp=now,
            severity=severity,
            status=AlertStatus.ACTIVE,
            fault_type=evaluation.fault_type,
            confidence=round(evaluation.anomaly_score, 2),
            early_warning_lead_time_sec=round(lead_time_sec, 1),
            sensor_evidence=evaluation.sensor_evidence,
            root_cause_explanation=root_cause,
            recommended_action=recommended_action,
            estimated_time_to_inspection_hours=inspection_window,
            estimated_remaining_useful_life_hours=evaluation.estimated_rul_hours,
        )

        self._active_alerts[machine_id] = alert
        self._alert_history.append(alert)

        # Sync to persistent storage
        from app.services.storage import storage_service
        storage_service.save_alert(alert)
        return alert

    def _map_severity(self, anomaly_score: float) -> AlertSeverity:
        """Map normalized anomaly score to discrete operational priority."""
        if anomaly_score >= 0.88:
            return AlertSeverity.CRITICAL
        elif anomaly_score >= 0.72:
            return AlertSeverity.HIGH
        elif anomaly_score >= 0.50:
            return AlertSeverity.MEDIUM
        else:
            return AlertSeverity.LOW

    def get_active_alerts(self, machine_id: Optional[str] = None) -> List[MaintenanceAlert]:
        """Return all active alerts, optionally filtered by machine_id."""
        alerts = list(self._active_alerts.values())
        if machine_id:
            alerts = [a for a in alerts if a.machine_id == machine_id]
        return [a for a in alerts if a.status == AlertStatus.ACTIVE]

    def get_alert_history(
        self,
        machine_id: Optional[str] = None,
        severity: Optional[AlertSeverity] = None,
        limit: int = 50,
    ) -> List[MaintenanceAlert]:
        """Return historical alerts matching filter criteria."""
        results = self._alert_history
        if machine_id:
            results = [a for a in results if a.machine_id == machine_id]
        if severity:
            results = [a for a in results if a.severity == severity]
        return results[-limit:]

    def acknowledge_alert(self, alert_id: str) -> Optional[MaintenanceAlert]:
        """Mark an active alert as ACKNOWLEDGED."""
        for alert in self._active_alerts.values():
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.ACKNOWLEDGED
                from app.services.storage import storage_service
                storage_service.update_alert_status(alert_id, AlertStatus.ACKNOWLEDGED)
                return alert
        return None

    def resolve_alert(self, alert_id: str) -> Optional[MaintenanceAlert]:
        """Mark an alert as RESOLVED and remove from active list."""
        for m_id, alert in list(self._active_alerts.items()):
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.RESOLVED
                self._active_alerts.pop(m_id, None)
                self._consecutive_counts[m_id] = 0
                self._first_warning_timestamps.pop(m_id, None)
                from app.services.storage import storage_service
                storage_service.update_alert_status(alert_id, AlertStatus.RESOLVED)
                return alert
        return None

    def clear(self) -> None:
        """Reset all alert states."""
        self._consecutive_counts.clear()
        self._first_warning_timestamps.clear()
        self._active_alerts.clear()
        self._alert_history.clear()


# Global singleton instance for application use
alert_engine = AlertEngine()
