# MachinaSense Backend

Intelligent Industrial Fault Detection and Predictive Maintenance API.

## 🚀 Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run with Docker (Recommended)
```bash
docker-compose up --build
```

### 3. Run Locally with Uvicorn
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API docs are available at:
* Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Run Automated Test Suite (35 Tests)
```bash
python -m pytest tests/ -v
```

### 5. Live Pitch & Demonstration Guide
See [demo_walkthrough.md](demo_walkthrough.md) for the 3-minute hackathon pitch script with exact curl commands for each judging rubric criterion.

---

## 📡 API Contracts Summary

### `POST /api/v1/telemetry/validate`
Validates industrial sensor packets against schema.

### `POST /api/v1/telemetry/ingest`
Ingests a single discrete sensor packet directly into the machine's in-memory rolling buffer.

### `GET /api/v1/telemetry/buffer/{machine_id}`
Returns the most recent N packets in the machine's sliding buffer.

### `GET /api/v1/telemetry/buffer/{machine_id}/stats`
Returns rolling statistical features (RMS, mean, std, peak-to-peak, kurtosis) across the window.

### `POST /api/v1/simulation/start?speed_multiplier=1.0`
Starts streaming/replaying the industrial run-to-failure dataset into the buffer.

### `POST /api/v1/simulation/stop`
Stops simulation and resets progress.

### `GET /api/v1/simulation/status`
Returns real-time simulation status, sample index, and progress percentage.

### `POST /api/v1/robustness/inject-config`
Dynamically configures complication injection (`noise_sigma`, `packet_drop_rate`, `missing_sensor_prob`, `transient_spike_prob`) for judge demos.

### `GET /api/v1/robustness/status`
Returns live audit metrics on repaired missing samples, suppressed spikes, and packet drop counts.

### `POST /api/v1/robustness/clean`
Demonstrates on-the-fly missing data imputation and noise suppression for a given test packet.

### `POST /api/v1/robustness/reset`
Resets fault injection and preprocessor metrics.

### `GET /api/v1/alerts/active`
Returns all currently active, unresolved maintenance alerts across monitored machines.

### `GET /api/v1/alerts/history`
Returns an audit trail of past triggered alerts, filterable by machine and severity.

### `POST /api/v1/alerts/{alert_id}/acknowledge`
Allows plant operators to acknowledge an active alert.

### `POST /api/v1/alerts/{alert_id}/resolve`
Marks an alert as resolved and removes it from the active alert queue.

### `POST /api/v1/inference/evaluate/{machine_id}`
Manually runs statistical and physics-informed anomaly detection on the machine's current sliding window.

### `GET /api/v1/inference/health-score/{machine_id}`
Returns current health score (0-100), anomaly index, dominant sensor, and ranked sensor evidence for frontend dashboards.

### `WS /ws/telemetry`
Real-time bidirectional WebSocket connection broadcasting live telemetry frames (`{"event": "telemetry", ...}`) and alert notifications (`{"event": "alert", ...}`) directly to frontend clients.

### `GET /api/v1/storage/alerts`
Retrieves persisted historical alerts stored in SQLite WAL database.

### `GET /api/v1/storage/telemetry/{machine_id}`
Retrieves logged time-series sensor readings from SQLite for historical charting.

### `GET /api/v1/system/metrics`
Collects real-time runtime compute, memory (RSS MB), CPU utilization, and inference latency percentiles (p50, p95, p99).

### `POST /api/v1/system/benchmark?iterations=100`
Executes an on-demand CPU/latency stress test against sliding buffers to measure throughput (req/s) and latency distribution.

### `GET /api/v1/alerts/mock`
Returns a sample evidence-backed alert for frontend development (includes severity, lead time, and sensor-level Z-scores).

### `GET /api/v1/machines/mock`
Returns fleet health status summaries.

---

## 🏆 Standalone Judge Evaluation CLI

Judges and evaluators can verify the entire pipeline on a held-out dataset using a single command:

```bash
python evaluate.py --test-data data/sample_bearing_degradation.csv
```

### Stress-Testing Complications (Noise & Packet Drops):
```bash
python evaluate.py --test-data data/sample_bearing_degradation.csv --noise-sigma 0.2 --drop-rate 0.1
```

### Exporting Reports:
```bash
python evaluate.py --output-md evaluation_report.md --output-json report.json
```




