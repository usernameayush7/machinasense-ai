"""Fault and complication injector: Simulates noisy readings, missing samples, and packet drops."""

import random
from typing import Optional, Dict, Any
from app.schemas.telemetry import TelemetryPacket, IndustrialSensors


class FaultInjector:
    """Injects realistic complications (noise, missing samples, packet loss, electrical spikes).
    
    Used to demonstrate system robustness on-demand to evaluators and hackathon judges.
    """

    def __init__(
        self,
        enabled: bool = False,
        packet_drop_rate: float = 0.0,
        missing_sensor_prob: float = 0.0,
        noise_sigma: float = 0.0,
        transient_spike_prob: float = 0.0,
    ):
        self.enabled = enabled
        self.packet_drop_rate = packet_drop_rate
        self.missing_sensor_prob = missing_sensor_prob
        self.noise_sigma = noise_sigma
        self.transient_spike_prob = transient_spike_prob

        # Injection audit metrics
        self.metrics = {
            "total_packets_seen": 0,
            "packets_dropped": 0,
            "missing_sensors_injected": 0,
            "noise_samples_added": 0,
            "transient_spikes_injected": 0,
        }

    def configure(
        self,
        enabled: Optional[bool] = None,
        packet_drop_rate: Optional[float] = None,
        missing_sensor_prob: Optional[float] = None,
        noise_sigma: Optional[float] = None,
        transient_spike_prob: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Update fault injection parameters dynamically."""
        if enabled is not None:
            self.enabled = enabled
        if packet_drop_rate is not None:
            self.packet_drop_rate = max(0.0, min(0.9, float(packet_drop_rate)))
        if missing_sensor_prob is not None:
            self.missing_sensor_prob = max(0.0, min(0.9, float(missing_sensor_prob)))
        if noise_sigma is not None:
            self.noise_sigma = max(0.0, float(noise_sigma))
        if transient_spike_prob is not None:
            self.transient_spike_prob = max(0.0, min(0.5, float(transient_spike_prob)))

        return self.get_config()

    def get_config(self) -> Dict[str, Any]:
        """Return current configuration and audit metrics."""
        return {
            "enabled": self.enabled,
            "packet_drop_rate": self.packet_drop_rate,
            "missing_sensor_prob": self.missing_sensor_prob,
            "noise_sigma": self.noise_sigma,
            "transient_spike_prob": self.transient_spike_prob,
            "metrics": dict(self.metrics),
        }

    def reset_metrics(self) -> None:
        """Reset fault injection metrics."""
        self.metrics = {
            "total_packets_seen": 0,
            "packets_dropped": 0,
            "missing_sensors_injected": 0,
            "noise_samples_added": 0,
            "transient_spikes_injected": 0,
        }

    def process(self, packet: TelemetryPacket) -> Optional[TelemetryPacket]:
        """Apply configured fault injection to an incoming packet.
        
        Returns None if packet is dropped by simulated network loss.
        """
        self.metrics["total_packets_seen"] += 1

        if not self.enabled:
            return packet

        # 1. Packet Loss Simulation
        if self.packet_drop_rate > 0.0 and random.random() < self.packet_drop_rate:
            self.metrics["packets_dropped"] += 1
            return None  # Dropped completely

        sensor_dict = packet.sensors.model_dump()
        target_keys = [
            "vibration_x_rms",
            "vibration_y_rms",
            "vibration_z_rms",
            "bearing_temperature_c",
            "motor_current_a",
            "rotational_speed_rpm",
            "acoustic_emission_db",
        ]

        corrupted_dict: Dict[str, Any] = {}

        for key in target_keys:
            val = sensor_dict.get(key)
            if val is None:
                corrupted_dict[key] = None
                continue

            current_val = float(val)

            # 2. Missing Sensor Reading Injection (set to None)
            if self.missing_sensor_prob > 0.0 and random.random() < self.missing_sensor_prob:
                self.metrics["missing_sensors_injected"] += 1
                corrupted_dict[key] = None
                continue

            # 3. Gaussian White Noise Injection
            if self.noise_sigma > 0.0:
                noise = random.gauss(0.0, self.noise_sigma)
                current_val += noise
                self.metrics["noise_samples_added"] += 1

            # 4. Electrical / Mechanical Transient Spike Injection
            if self.transient_spike_prob > 0.0 and random.random() < self.transient_spike_prob:
                spike_multiplier = random.choice([5.0, 8.0, 10.0])
                current_val = current_val * spike_multiplier
                self.metrics["transient_spikes_injected"] += 1

            corrupted_dict[key] = round(max(0.0, current_val), 4)

        corrupted_dict["custom_metrics"] = sensor_dict.get("custom_metrics", {})

        # If every sensor reading was dropped, treat packet as lost/dropped in transit
        non_none_sensors = [
            v for k, v in corrupted_dict.items()
            if k != "custom_metrics" and v is not None
        ]
        if not non_none_sensors and not corrupted_dict["custom_metrics"]:
            self.metrics["packets_dropped"] += 1
            return None

        corrupted_sensors = IndustrialSensors(**corrupted_dict)

        return TelemetryPacket(
            machine_id=packet.machine_id,
            timestamp=packet.timestamp,
            operating_mode=packet.operating_mode,
            sensors=corrupted_sensors,
            is_simulated=True,
            metadata={**packet.metadata, "fault_injected": True}
        )


# Global singleton instance for application use
fault_injector = FaultInjector()
