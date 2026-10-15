"""In-memory sliding window buffer for real-time industrial telemetry."""

import math
from collections import deque
from typing import Dict, List, Optional, Any
import numpy as np

from app.schemas.telemetry import TelemetryPacket


class SlidingBuffer:
    """Sliding window buffer for a single machine holding the latest N telemetry samples."""

    def __init__(self, machine_id: str, max_size: int = 128):
        self.machine_id = machine_id
        self.max_size = max_size
        self._buffer: deque[TelemetryPacket] = deque(maxlen=max_size)

    def append(self, packet: TelemetryPacket) -> None:
        """Add a new telemetry packet. Automatically discards the oldest if full."""
        self._buffer.append(packet)

    def __len__(self) -> int:
        return len(self._buffer)

    @property
    def is_full(self) -> bool:
        """Check if buffer has reached configured capacity."""
        return len(self._buffer) >= self.max_size

    def get_all(self) -> List[TelemetryPacket]:
        """Return all packets currently in the window, ordered oldest to newest."""
        return list(self._buffer)

    def clear(self) -> None:
        """Clear all samples in the buffer."""
        self._buffer.clear()

    def get_sensor_series(self, sensor_name: str) -> np.ndarray:
        """Extract a 1D numpy array for a specific sensor across the window.
        
        Supports standard sensors or custom metrics. Returns empty array if buffer is empty.
        """
        if not self._buffer:
            return np.empty(0, dtype=np.float64)

        values = []
        for packet in self._buffer:
            val = getattr(packet.sensors, sensor_name, None)
            if val is None and packet.sensors.custom_metrics:
                val = packet.sensors.custom_metrics.get(sensor_name)
            
            if val is not None and not math.isnan(val):
                values.append(float(val))
            else:
                values.append(np.nan)

        return np.array(values, dtype=np.float64)

    def get_stats(self) -> Dict[str, Dict[str, float]]:
        """Calculate statistical features (mean, std, rms, min, max, peak_to_peak, kurtosis).
        
        Gracefully handles empty or single-element buffers without dividing by zero.
        """
        if len(self._buffer) == 0:
            return {}

        sensor_keys = [
            "vibration_x_rms",
            "vibration_y_rms",
            "vibration_z_rms",
            "bearing_temperature_c",
            "motor_current_a",
            "rotational_speed_rpm",
            "acoustic_emission_db",
        ]

        stats_summary: Dict[str, Dict[str, float]] = {}

        for key in sensor_keys:
            series = self.get_sensor_series(key)
            # Filter out NaNs if any
            clean_series = series[~np.isnan(series)]

            if len(clean_series) == 0:
                continue

            n = len(clean_series)
            mean_val = float(np.mean(clean_series))
            std_val = float(np.std(clean_series, ddof=1)) if n > 1 else 0.0
            rms_val = float(np.sqrt(np.mean(clean_series ** 2)))
            min_val = float(np.min(clean_series))
            max_val = float(np.max(clean_series))
            peak_to_peak = max_val - min_val

            # Kurtosis calculation (excess kurtosis relative to normal distribution)
            if n > 3 and std_val > 1e-8:
                m4 = np.mean((clean_series - mean_val) ** 4)
                kurtosis_val = float(m4 / (std_val ** 4) - 3.0)
            else:
                kurtosis_val = 0.0

            stats_summary[key] = {
                "count": float(n),
                "mean": round(mean_val, 4),
                "std": round(std_val, 4),
                "rms": round(rms_val, 4),
                "min": round(min_val, 4),
                "max": round(max_val, 4),
                "peak_to_peak": round(peak_to_peak, 4),
                "kurtosis": round(kurtosis_val, 4),
            }

        return stats_summary


class BufferManager:
    """Thread-safe manager maintaining separate sliding buffers for each monitored asset."""

    def __init__(self, default_buffer_size: int = 128):
        self.default_buffer_size = default_buffer_size
        self._buffers: Dict[str, SlidingBuffer] = {}

    def get_or_create(self, machine_id: str, max_size: Optional[int] = None) -> SlidingBuffer:
        """Retrieve existing buffer for machine_id or initialize a new one."""
        if machine_id not in self._buffers:
            size = max_size or self.default_buffer_size
            self._buffers[machine_id] = SlidingBuffer(machine_id=machine_id, max_size=size)
        return self._buffers[machine_id]

    def push(self, packet: TelemetryPacket) -> None:
        """Route incoming telemetry packet to its respective machine buffer."""
        buffer = self.get_or_create(packet.machine_id)
        buffer.append(packet)

    def get_buffer(self, machine_id: str) -> Optional[SlidingBuffer]:
        """Get buffer if it exists, otherwise return None."""
        return self._buffers.get(machine_id)

    def get_all_machine_ids(self) -> List[str]:
        """Return list of all registered machine IDs."""
        return list(self._buffers.keys())

    def clear(self, machine_id: Optional[str] = None) -> None:
        """Clear specific buffer or all buffers."""
        if machine_id:
            if machine_id in self._buffers:
                self._buffers[machine_id].clear()
        else:
            for buf in self._buffers.values():
                buf.clear()


# Global singleton instance for application use
buffer_manager = BufferManager()
