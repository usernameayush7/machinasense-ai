"""Dataset generator and CSV loader for industrial run-to-failure scenarios."""

import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

from app.schemas.telemetry import TelemetryPacket, IndustrialSensors


def generate_run_to_failure_dataset(
    machine_id: str = "CNC_MILL_01",
    total_samples: int = 500,
    sample_interval_sec: float = 1.0,
    save_csv_path: Optional[str] = None,
) -> pd.DataFrame:
    """Generate a realistic P-F (Potential to Functional failure) degradation curve.
    
    Phases:
      1. Healthy (0% - 40%): Baseline steady operation.
      2. Incipient Fault (40% - 70%): Subtle micro-pitting in bearing, early high-frequency vibration.
      3. Severe Degradation (70% - 90%): Harmonic growth, thermal dissipation increases, noticeable acoustics.
      4. Critical Failure (90% - 100%): Structural damage, erratic vibration > 5g, overheating > 85°C.
    """
    np.random.seed(42)  # For reproducible hackathon demonstrations
    t = np.linspace(0, 1, total_samples)

    # 1. Base normal signals + Gaussian noise
    vib_x_base = 1.2 + 0.1 * np.random.randn(total_samples)
    vib_y_base = 1.4 + 0.12 * np.random.randn(total_samples)
    vib_z_base = 0.9 + 0.08 * np.random.randn(total_samples)
    temp_base = 56.0 + 0.8 * np.random.randn(total_samples)
    curr_base = 14.0 + 0.3 * np.random.randn(total_samples)
    rpm_base = 1800.0 + 5.0 * np.random.randn(total_samples)
    acoustic_base = 72.0 + 1.0 * np.random.randn(total_samples)

    # 2. Add degradation curves starting at 40% (t >= 0.40)
    degradation_factor = np.zeros(total_samples)
    active_idx = np.where(t >= 0.40)[0]
    
    # Exponential-like degradation ramp
    normalized_t = (t[active_idx] - 0.40) / 0.60
    degradation_factor[active_idx] = (np.exp(3.0 * normalized_t) - 1.0) / (np.exp(3.0) - 1.0)

    # Apply degradation physics to sensor channels
    # Vibration: Primary indicator (rises sharply)
    vib_x = vib_x_base + 3.8 * degradation_factor + 0.2 * degradation_factor * np.random.randn(total_samples)
    vib_y = vib_y_base + 4.2 * degradation_factor + 0.25 * degradation_factor * np.random.randn(total_samples)
    vib_z = vib_z_base + 2.5 * degradation_factor

    # Thermal: Secondary lag indicator (rises with friction)
    temp = temp_base + 32.0 * (degradation_factor ** 1.5)

    # Acoustic: Early indicator (emissions start spiking earlier)
    acoustic = acoustic_base + 18.0 * (degradation_factor ** 0.8)

    # Motor current: Motor draws higher power to overcome bearing friction
    curr = curr_base + 8.0 * (degradation_factor ** 2)

    # Rotational speed: Slight speed drops under high load
    rpm = rpm_base - 60.0 * (degradation_factor ** 2)

    # 3. Label ground truth states & remaining time
    ground_truth_labels = []
    fault_point_idx = int(0.90 * total_samples)  # Failure defined at 90%
    failure_timestamp = datetime.now(timezone.utc) + timedelta(seconds=(total_samples - fault_point_idx) * sample_interval_sec)

    start_time = datetime.now(timezone.utc) - timedelta(seconds=total_samples * sample_interval_sec)
    timestamps = [start_time + timedelta(seconds=i * sample_interval_sec) for i in range(total_samples)]

    lead_times_to_failure = []

    for i in range(total_samples):
        current_time = timestamps[i]
        time_to_failure = max(0.0, (fault_point_idx - i) * sample_interval_sec)
        lead_times_to_failure.append(time_to_failure)

        if t[i] < 0.40:
            ground_truth_labels.append("HEALTHY")
        elif t[i] < 0.70:
            ground_truth_labels.append("INCIPIENT_FAULT")
        elif t[i] < 0.90:
            ground_truth_labels.append("SEVERE_DEGRADATION")
        else:
            ground_truth_labels.append("CRITICAL_FAILURE")

    df = pd.DataFrame({
        "timestamp": [ts.isoformat() for ts in timestamps],
        "machine_id": machine_id,
        "operating_mode": "HIGH_LOAD",
        "vibration_x_rms": np.round(vib_x, 4),
        "vibration_y_rms": np.round(vib_y, 4),
        "vibration_z_rms": np.round(vib_z, 4),
        "bearing_temperature_c": np.round(temp, 2),
        "motor_current_a": np.round(curr, 2),
        "rotational_speed_rpm": np.round(rpm, 1),
        "acoustic_emission_db": np.round(acoustic, 1),
        "ground_truth_state": ground_truth_labels,
        "lead_time_to_failure_sec": lead_times_to_failure,
    })

    if save_csv_path:
        os.makedirs(os.path.dirname(os.path.abspath(save_csv_path)), exist_ok=True)
        df.to_csv(save_csv_path, index=False)
        print(f"[INFO] Generated synthetic dataset with {total_samples} samples at {save_csv_path}")

    return df


def load_dataset_from_csv(csv_path: str) -> List[TelemetryPacket]:
    """Parse a CSV dataset file into structured TelemetryPacket objects."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset CSV not found at: {csv_path}")

    df = pd.read_csv(csv_path)
    packets: List[TelemetryPacket] = []

    for _, row in df.iterrows():
        # Parse timestamp safely
        ts_val = row.get("timestamp")
        if pd.notna(ts_val):
            try:
                ts = datetime.fromisoformat(str(ts_val))
            except ValueError:
                ts = datetime.now(timezone.utc)
        else:
            ts = datetime.now(timezone.utc)

        machine_id = str(row.get("machine_id", "CNC_MILL_01"))
        op_mode = str(row.get("operating_mode", "NORMAL"))

        sensors = IndustrialSensors(
            vibration_x_rms=float(row.get("vibration_x_rms", 1.0)),
            vibration_y_rms=float(row.get("vibration_y_rms", 1.0)),
            vibration_z_rms=float(row["vibration_z_rms"]) if pd.notna(row.get("vibration_z_rms")) else None,
            bearing_temperature_c=float(row.get("bearing_temperature_c", 50.0)),
            motor_current_a=float(row.get("motor_current_a", 10.0)),
            rotational_speed_rpm=float(row["rotational_speed_rpm"]) if pd.notna(row.get("rotational_speed_rpm")) else None,
            acoustic_emission_db=float(row["acoustic_emission_db"]) if pd.notna(row.get("acoustic_emission_db")) else None,
        )

        metadata: Dict[str, Any] = {}
        if "ground_truth_state" in row and pd.notna(row["ground_truth_state"]):
            metadata["ground_truth_state"] = str(row["ground_truth_state"])
        if "lead_time_to_failure_sec" in row and pd.notna(row["lead_time_to_failure_sec"]):
            metadata["lead_time_to_failure_sec"] = float(row["lead_time_to_failure_sec"])

        packets.append(TelemetryPacket(
            machine_id=machine_id,
            timestamp=ts,
            operating_mode=op_mode,
            sensors=sensors,
            is_simulated=True,
            metadata=metadata
        ))

    return packets
