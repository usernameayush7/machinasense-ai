"""Machine health and asset status schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MachineHealthState(str, Enum):
    """Operational health status of industrial equipment."""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"
    OFFLINE = "OFFLINE"


class MachineSummary(BaseModel):
    """Real-time summary of an industrial equipment asset."""

    machine_id: str = Field(
        ...,
        description="Unique machine identifier",
        examples=["CNC_MILL_01"]
    )
    name: str = Field(
        ...,
        description="Human-readable machine name",
        examples=["High-Speed CNC Milling Spindle"]
    )
    type: str = Field(
        default="Rotary Equipment",
        description="Equipment classification category",
        examples=["CNC Mill", "Centrifugal Pump", "Induction Motor"]
    )
    health_state: MachineHealthState = Field(
        default=MachineHealthState.HEALTHY,
        description="Overall health status"
    )
    health_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Normalized health index (100 = Brand new, 0 = Catastrophic failure)",
        examples=[94.5]
    )
    last_telemetry_timestamp: Optional[datetime] = Field(
        default=None,
        description="Timestamp of most recent received telemetry"
    )
    active_alerts_count: int = Field(
        default=0,
        description="Count of currently unresolved alerts"
    )
    operating_mode: str = Field(
        default="NORMAL",
        description="Current operating regime"
    )

    model_config = ConfigDict(extra="ignore")
