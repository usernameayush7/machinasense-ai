"""Telemetry data contracts and Pydantic validation schemas."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict


def current_utc_time() -> datetime:
    """Return current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class IndustrialSensors(BaseModel):
    """Core industrial equipment sensor readings.
    
    Covers vibration, thermal, electrical, and rotational dynamics.
    """
    vibration_x_rms: Optional[float] = Field(
        default=None,
        description="X-axis vibration Root Mean Square (in g-force units)",
        examples=[1.45]
    )
    vibration_y_rms: Optional[float] = Field(
        default=None,
        description="Y-axis vibration Root Mean Square (in g-force units)",
        examples=[1.62]
    )
    vibration_z_rms: Optional[float] = Field(
        default=None,
        description="Z-axis vibration Root Mean Square (in g-force units)",
        examples=[1.20]
    )
    bearing_temperature_c: Optional[float] = Field(
        default=None,
        description="Bearing or housing surface temperature in Celsius",
        examples=[62.5]
    )
    motor_current_a: Optional[float] = Field(
        default=None,
        description="Electric motor drive current in Amperes",
        examples=[14.2]
    )
    rotational_speed_rpm: Optional[float] = Field(
        default=None,
        description="Shaft or spindle rotational speed in Revolutions Per Minute",
        examples=[1750.0]
    )
    acoustic_emission_db: Optional[float] = Field(
        default=None,
        description="High-frequency acoustic or ultrasound signature in decibels",
        examples=[78.4]
    )
    custom_metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="Additional domain-specific sensors (e.g. pressure_bar, flow_rate_lpm)",
        examples=[{"hydraulic_pressure_bar": 120.5}]
    )

    model_config = ConfigDict(extra="allow")

    from pydantic import model_validator

    @model_validator(mode="after")
    def check_at_least_one_sensor(self) -> "IndustrialSensors":
        data = self.model_dump(exclude_none=True)
        custom = data.pop("custom_metrics", {})
        if len(data) == 0 and len(custom) == 0:
            raise ValueError("Telemetry packet must contain at least one valid sensor reading.")
        return self


class TelemetryPacket(BaseModel):
    """Single discrete telemetry packet received from industrial machinery or simulator."""

    machine_id: str = Field(
        ...,
        min_length=1,
        description="Unique identifier for the monitored machine/asset",
        examples=["CNC_MILL_01"]
    )
    timestamp: datetime = Field(
        default_factory=current_utc_time,
        description="Timestamp of telemetry capture (ISO 8601)",
        examples=["2026-10-14T23:30:00Z"]
    )
    operating_mode: str = Field(
        default="NORMAL",
        description="Operational regime (e.g. IDLE, NORMAL, HIGH_LOAD, TRANSITION)",
        examples=["NORMAL"]
    )
    sensors: IndustrialSensors = Field(
        ...,
        description="Structured sensor payload"
    )
    is_simulated: bool = Field(
        default=False,
        description="Flag indicating synthetic or replayed telemetry"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary metadata such as batch number, operator id, or firmware version"
    )

    model_config = ConfigDict(extra="ignore")


class TelemetryValidationResponse(BaseModel):
    """Validation response confirming packet format and parsed attributes."""

    valid: bool
    machine_id: str
    timestamp: datetime
    sensor_count: int
    message: str
