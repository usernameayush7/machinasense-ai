"""Maintenance alert and anomaly evidence data contracts."""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AlertSeverity(str, Enum):
    """Interpretable priority indicator for industrial maintenance."""
    INFO = "INFO"          # Informational telemetry change, negligible risk
    LOW = "LOW"            # Early drift detected, monitor in routine shift
    MEDIUM = "MEDIUM"      # Moderate anomaly, schedule inspection within 24h
    HIGH = "HIGH"          # Significant abnormal condition, inspect within 2-4h
    CRITICAL = "CRITICAL"  # Imminent failure risk, trigger emergency maintenance


class AlertStatus(str, Enum):
    """Lifecycle state of an alert ticket."""
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class FaultType(str, Enum):
    """Categorized industrial fault classes."""
    BEARING_INNER_RACE_FAULT = "BEARING_INNER_RACE_FAULT"
    BEARING_OUTER_RACE_FAULT = "BEARING_OUTER_RACE_FAULT"
    BEARING_BALL_FAULT = "BEARING_BALL_FAULT"
    MOTOR_OVERHEATING = "MOTOR_OVERHEATING"
    MASS_UNBALANCE = "MASS_UNBALANCE"
    SHAFT_MISALIGNMENT = "SHAFT_MISALIGNMENT"
    ELECTRICAL_PHASE_UNBALANCE = "ELECTRICAL_PHASE_UNBALANCE"
    GEAR_MESH_WEAR = "GEAR_MESH_WEAR"
    LUBRICATION_STARVATION = "LUBRICATION_STARVATION"
    GENERIC_ANOMALY = "GENERIC_ANOMALY"


class AnomalyEvidence(BaseModel):
    """Interpretable evidence attributing an alert to specific sensor signals."""

    sensor_name: str = Field(
        ...,
        description="Name of the sensor signal contributing to the alert",
        examples=["vibration_y_rms"]
    )
    observed_value: float = Field(
        ...,
        description="Value measured during the anomaly event",
        examples=[3.42]
    )
    baseline_mean: float = Field(
        ...,
        description="Normal operating baseline mean for this regime",
        examples=[1.45]
    )
    baseline_std: float = Field(
        ...,
        description="Normal operating standard deviation",
        examples=[0.25]
    )
    z_score: float = Field(
        ...,
        description="Statistical deviation in standard deviations (observed - mean)/std",
        examples=[7.88]
    )
    contribution_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage contribution of this sensor to the overall anomaly score",
        examples=[65.4]
    )
    unit: str = Field(
        ...,
        description="Unit of measurement",
        examples=["g"]
    )
    description: str = Field(
        ...,
        description="Human-interpretable explanation of the sensor anomaly",
        examples=["Vibration Y RMS is 7.9 sigma above normal baseline."]
    )

    model_config = ConfigDict(extra="ignore")


class MaintenanceAlert(BaseModel):
    """Evidence-backed maintenance alert with severity, lead time, and action."""

    alert_id: str = Field(
        ...,
        description="Unique identifier for the alert event",
        examples=["ALT-20261014-001"]
    )
    machine_id: str = Field(
        ...,
        description="Identifier of the affected equipment",
        examples=["CNC_MILL_01"]
    )
    timestamp: datetime = Field(
        ...,
        description="Timestamp when the anomaly was verified and alert triggered"
    )
    severity: AlertSeverity = Field(
        ...,
        description="Priority/severity indicator"
    )
    status: AlertStatus = Field(
        default=AlertStatus.ACTIVE,
        description="Current operational lifecycle status"
    )
    fault_type: str = Field(
        default=FaultType.GENERIC_ANOMALY.value,
        description="Identified or classified fault category",
        examples=["BEARING_INNER_RACE_FAULT"]
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score between 0.0 and 1.0",
        examples=[0.92]
    )
    early_warning_lead_time_sec: Optional[float] = Field(
        default=None,
        description="Elapsed early warning lead time before critical threshold/failure point",
        examples=[540.0]
    )
    sensor_evidence: List[AnomalyEvidence] = Field(
        default_factory=list,
        description="Sensor-level root cause evidence backing this alert"
    )
    root_cause_explanation: str = Field(
        ...,
        description="Actionable explanation summarizing the condition",
        examples=["Elevated Y-axis vibration coupled with housing temperature rise indicates bearing degradation."]
    )
    recommended_action: str = Field(
        ...,
        description="Prescriptive maintenance action for plant technicians",
        examples=["Perform grease lubrication check and inspect drive belt tension within 4 operating hours."]
    )
    estimated_time_to_inspection_hours: Optional[float] = Field(
        default=None,
        description="Recommended time window before physical inspection is required",
        examples=[4.0]
    )
    estimated_remaining_useful_life_hours: Optional[float] = Field(
        default=None,
        description="Estimated Remaining Useful Life (RUL) if supported by data",
        examples=[38.5]
    )

    model_config = ConfigDict(extra="ignore")
