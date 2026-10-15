"""Services package for MachinaSense backend."""

from app.services.buffer_manager import SlidingBuffer, BufferManager, buffer_manager
from app.services.dataset_generator import (
    generate_run_to_failure_dataset,
    load_dataset_from_csv,
)
from app.services.telemetry_streamer import TelemetryStreamer, telemetry_streamer
from app.services.preprocessor import RobustnessPreprocessor, robustness_preprocessor
from app.services.fault_injector import FaultInjector, fault_injector
from app.services.inference_engine import (
    InferenceEngine,
    inference_engine,
    StatisticalAnomalyDetector,
    AnomalyEvaluationResult,
)
from app.services.alert_engine import AlertEngine, alert_engine
from app.services.storage import StorageService, storage_service
from app.services.websocket_manager import WebSocketManager, ws_manager
from app.services.benchmarker import PerformanceBenchmarker, benchmarker

__all__ = [
    "SlidingBuffer",
    "BufferManager",
    "buffer_manager",
    "generate_run_to_failure_dataset",
    "load_dataset_from_csv",
    "TelemetryStreamer",
    "telemetry_streamer",
    "RobustnessPreprocessor",
    "robustness_preprocessor",
    "FaultInjector",
    "fault_injector",
    "InferenceEngine",
    "inference_engine",
    "StatisticalAnomalyDetector",
    "AnomalyEvaluationResult",
    "AlertEngine",
    "alert_engine",
    "StorageService",
    "storage_service",
    "WebSocketManager",
    "ws_manager",
    "PerformanceBenchmarker",
    "benchmarker",
]
