"""Unit and integration tests for Sprint 6: Performance Benchmarking and Evaluation CLI."""

import os
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.services.benchmarker import PerformanceBenchmarker
from evaluate import run_evaluation

client = TestClient(app)


def test_performance_benchmarker_metrics():
    """Verify benchmarker collects latencies and calculates accurate percentiles."""
    bm = PerformanceBenchmarker()

    # Record sample latencies: 1ms, 2ms, 3ms, 4ms, 5ms
    for d in [0.001, 0.002, 0.003, 0.004, 0.005]:
        bm.record_inference_time(d)

    metrics = bm.get_system_metrics()
    assert "memory" in metrics
    assert "latency_ms" in metrics
    assert "throughput" in metrics
    assert "edge_deployment_assessment" in metrics

    assert metrics["memory"]["rss_mb"] > 0
    assert metrics["latency_ms"]["mean"] == 3.0
    assert metrics["latency_ms"]["p50"] == 3.0
    assert metrics["latency_ms"]["max"] == 5.0
    assert metrics["throughput"]["total_inferences"] >= 5


def test_benchmarker_stress_test():
    """Verify rapid on-demand CPU/latency stress test against sliding buffers."""
    bm = PerformanceBenchmarker()
    result = bm.run_benchmark_stress_test(iterations=25)

    assert result["iterations"] == 25
    assert result["mean_latency_ms"] >= 0.0
    assert result["p95_latency_ms"] >= 0.0
    assert result["throughput_req_per_sec"] > 0


def test_evaluate_cli_programmatic_run(tmp_path):
    """Test running the judge evaluation pipeline on dataset."""
    json_report = str(tmp_path / "report.json")
    md_report = str(tmp_path / "report.md")

    results = run_evaluation(
        dataset_path="data/sample_bearing_degradation.csv",
        noise_sigma=0.05,
        packet_drop_rate=0.02,
        output_json=json_report,
        output_md=md_report,
    )

    assert os.path.exists(json_report)
    assert os.path.exists(md_report)

    dp = results["detection_performance"]
    ew = results["early_warning_metrics"]
    de = results["deployment_efficiency"]

    assert dp["precision"] >= 0.90
    assert dp["f1_score"] >= 0.70
    assert ew["lead_time_advantage_samples"] > 0
    assert de["mean_inference_latency_ms"] < 20.0
    assert de["edge_ready"] is True


def test_api_system_metrics_endpoint():
    """Test GET /api/v1/system/metrics returns deployment profiling report."""
    response = client.get("/api/v1/system/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "memory" in data
    assert "rss_mb" in data["memory"]
    assert "latency_ms" in data
    assert "edge_deployment_assessment" in data


def test_api_system_benchmark_endpoint():
    """Test POST /api/v1/system/benchmark triggers stress benchmark."""
    response = client.post("/api/v1/system/benchmark?iterations=20")
    assert response.status_code == 200
    data = response.json()
    assert data["iterations"] == 20
    assert "mean_latency_ms" in data
    assert "p95_latency_ms" in data
    assert "throughput_req_per_sec" in data
