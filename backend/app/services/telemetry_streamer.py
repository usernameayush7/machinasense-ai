"""Asynchronous telemetry streaming and dataset playback service."""

import asyncio
from typing import Callable, Coroutine, List, Optional, Any
from app.schemas.telemetry import TelemetryPacket
from app.services.buffer_manager import buffer_manager

TelemetryCallback = Callable[[TelemetryPacket], Coroutine[Any, Any, None]]


class TelemetryStreamer:
    """Async background worker that replays industrial telemetry packets."""

    def __init__(self, base_rate_hz: float = 10.0):
        self.base_rate_hz = base_rate_hz
        self.speed_multiplier: float = 1.0
        self._packets: List[TelemetryPacket] = []
        self._current_index: int = 0
        self._task: Optional[asyncio.Task] = None
        self._is_paused: bool = False
        self._listeners: List[TelemetryCallback] = []
        self._lock = asyncio.Lock()

        # Register default listener to push into buffer_manager, evaluate inference, and broadcast via WebSockets
        async def _default_pipeline_listener(packet: TelemetryPacket) -> None:
            buffer_manager.push(packet)
            from app.services.inference_engine import inference_engine
            from app.services.alert_engine import alert_engine
            from app.services.websocket_manager import ws_manager
            from app.services.storage import storage_service

            # 1. Broadcast live telemetry packet over WebSocket
            await ws_manager.broadcast_telemetry(packet)

            # 2. Run inference with real-time latency profiling
            import time
            from app.services.benchmarker import benchmarker

            t0 = time.perf_counter()
            eval_result = inference_engine.evaluate_machine(packet.machine_id)
            dt = time.perf_counter() - t0
            benchmarker.record_inference_time(dt)

            alert = alert_engine.process_evaluation(eval_result, timestamp=packet.timestamp)

            # 3. If an alert is triggered/updated, broadcast immediately over WebSocket
            if alert:
                await ws_manager.broadcast_alert(alert)

            # 4. Asynchronously log telemetry point for historical audit
            storage_service.log_telemetry(
                machine_id=packet.machine_id,
                timestamp=packet.timestamp,
                vibration_x_rms=packet.sensors.vibration_x_rms,
                vibration_y_rms=packet.sensors.vibration_y_rms,
                vibration_z_rms=packet.sensors.vibration_z_rms,
                bearing_temperature_c=packet.sensors.bearing_temperature_c,
                motor_current_a=packet.sensors.motor_current_a,
                rotational_speed_rpm=packet.sensors.rotational_speed_rpm,
                acoustic_emission_db=packet.sensors.acoustic_emission_db,
                operating_mode=packet.operating_mode,
            )

        self.register_listener(_default_pipeline_listener)

    @property
    def is_running(self) -> bool:
        """True if the background streamer task is currently active."""
        return self._task is not None and not self._task.done()

    @property
    def is_paused(self) -> bool:
        """True if playback is paused."""
        return self._is_paused

    @property
    def progress(self) -> dict:
        """Current playback status and progress metrics."""
        total = len(self._packets)
        pct = (self._current_index / total * 100.0) if total > 0 else 0.0
        return {
            "is_running": self.is_running,
            "is_paused": self._is_paused,
            "current_index": self._current_index,
            "total_samples": total,
            "progress_pct": round(pct, 2),
            "speed_multiplier": self.speed_multiplier,
            "base_rate_hz": self.base_rate_hz,
        }

    def register_listener(self, listener: TelemetryCallback) -> None:
        """Add an asynchronous subscriber that receives each streamed packet."""
        if listener not in self._listeners:
            self._listeners.append(listener)

    def load_packets(self, packets: List[TelemetryPacket]) -> None:
        """Load a sequence of packets to replay."""
        self._packets = list(packets)
        self._current_index = 0

    def set_speed(self, multiplier: float) -> None:
        """Adjust playback speed multiplier (e.g. 1.0 = real-time, 5.0 = 5x faster)."""
        if multiplier <= 0:
            raise ValueError("Speed multiplier must be positive")
        self.speed_multiplier = float(multiplier)

    async def start(
        self,
        packets: Optional[List[TelemetryPacket]] = None,
        speed_multiplier: Optional[float] = None,
        loop_infinite: bool = False,
    ) -> None:
        """Start streaming packets in a background asyncio task."""
        async with self._lock:
            if self.is_running:
                return  # Already running

            if packets is not None:
                self.load_packets(packets)

            if len(self._packets) == 0:
                raise ValueError("No packets loaded to stream. Load packets or provide dataset first.")

            if speed_multiplier is not None:
                self.set_speed(speed_multiplier)

            self._is_paused = False
            self._task = asyncio.create_task(self._stream_loop(loop_infinite=loop_infinite))

    async def pause(self) -> None:
        """Pause playback without resetting progress."""
        self._is_paused = True

    async def resume(self) -> None:
        """Resume paused playback."""
        self._is_paused = False

    async def stop(self) -> None:
        """Stop playback and cancel background task."""
        async with self._lock:
            if self._task and not self._task.done():
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
            self._task = None
            self._is_paused = False
            self._current_index = 0

    async def _stream_loop(self, loop_infinite: bool = False) -> None:
        """Internal asynchronous playback loop."""
        try:
            while True:
                if self._current_index >= len(self._packets):
                    if loop_infinite:
                        self._current_index = 0
                    else:
                        break  # Finished playback

                if self._is_paused:
                    await asyncio.sleep(0.1)
                    continue

                packet = self._packets[self._current_index]
                self._current_index += 1

                # 1. Fault injection (if enabled for demonstration)
                from app.services.fault_injector import fault_injector
                if fault_injector.enabled:
                    corrupted = fault_injector.process(packet)
                    if corrupted is None:
                        # Simulated network packet drop
                        continue
                    packet = corrupted

                # 2. Robustness Preprocessing (imputation & noise attenuation)
                from app.services.preprocessor import robustness_preprocessor
                cleaned_packet, _ = robustness_preprocessor.clean_packet(packet)

                # Broadcast to all registered listeners
                for listener in self._listeners:
                    try:
                        await listener(cleaned_packet)
                    except Exception as err:
                        print(f"[WARNING] Error in telemetry streamer listener: {err}")

                # Sleep duration based on sampling rate and speed
                base_interval = 1.0 / self.base_rate_hz
                sleep_sec = base_interval / max(0.1, self.speed_multiplier)
                await asyncio.sleep(sleep_sec)

        except asyncio.CancelledError:
            # Expected on stop()
            pass
        except Exception as e:
            print(f"[ERROR] Unexpected error in telemetry streamer: {e}")
        finally:
            self._task = None


# Global singleton instance for application use
telemetry_streamer = TelemetryStreamer()
