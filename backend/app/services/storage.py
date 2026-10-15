"""Embedded time-series and alert persistence using SQLite in WAL mode."""

import os
import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.schemas.alert import MaintenanceAlert, AlertSeverity, AlertStatus


class StorageService:
    """Thread-safe SQLite storage engine with Write-Ahead Logging (WAL) for industrial telemetry and alerts."""

    def __init__(self, db_path: str = "data/machinasense.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self._init_database()

    def _get_connection(self) -> sqlite3.Connection:
        """Get an optimized SQLite connection with foreign keys and WAL mode."""
        conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=10.0)
        conn.row_factory = sqlite3.Row
        # Enable WAL mode for high concurrency
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _init_database(self) -> None:
        """Create necessary tables and indexes if they do not exist."""
        with self._get_connection() as conn:
            # 1. Maintenance Alerts table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    alert_id TEXT PRIMARY KEY,
                    machine_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    status TEXT NOT NULL,
                    fault_type TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    early_warning_lead_time_sec REAL,
                    sensor_evidence_json TEXT,
                    root_cause_explanation TEXT,
                    recommended_action TEXT,
                    estimated_time_to_inspection_hours REAL,
                    estimated_remaining_useful_life_hours REAL,
                    created_at TEXT NOT NULL
                );
            """)

            # 2. Telemetry historical logs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    machine_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    vibration_x_rms REAL,
                    vibration_y_rms REAL,
                    vibration_z_rms REAL,
                    bearing_temperature_c REAL,
                    motor_current_a REAL,
                    rotational_speed_rpm REAL,
                    acoustic_emission_db REAL,
                    operating_mode TEXT
                );
            """)

            # Indexes for low-latency querying
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_machine ON alerts(machine_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_machine_time ON telemetry_log(machine_id, timestamp);")

    def save_alert(self, alert: MaintenanceAlert) -> None:
        """Upsert a maintenance alert."""
        evidence_json = json.dumps([e.model_dump() for e in alert.sensor_evidence])
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO alerts (
                    alert_id, machine_id, timestamp, severity, status, fault_type,
                    confidence, early_warning_lead_time_sec, sensor_evidence_json,
                    root_cause_explanation, recommended_action,
                    estimated_time_to_inspection_hours,
                    estimated_remaining_useful_life_hours, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(alert_id) DO UPDATE SET
                    timestamp=excluded.timestamp,
                    severity=excluded.severity,
                    status=excluded.status,
                    confidence=excluded.confidence,
                    early_warning_lead_time_sec=excluded.early_warning_lead_time_sec,
                    sensor_evidence_json=excluded.sensor_evidence_json,
                    estimated_remaining_useful_life_hours=excluded.estimated_remaining_useful_life_hours;
            """, (
                alert.alert_id,
                alert.machine_id,
                alert.timestamp.isoformat(),
                alert.severity.value,
                alert.status.value,
                alert.fault_type,
                alert.confidence,
                alert.early_warning_lead_time_sec,
                evidence_json,
                alert.root_cause_explanation,
                alert.recommended_action,
                alert.estimated_time_to_inspection_hours,
                alert.estimated_remaining_useful_life_hours,
                now_iso,
            ))

    def update_alert_status(self, alert_id: str, new_status: AlertStatus) -> bool:
        """Update operational status of an alert (e.g. ACKNOWLEDGED or RESOLVED)."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "UPDATE alerts SET status = ? WHERE alert_id = ?;",
                (new_status.value, alert_id)
            )
            return cursor.rowcount > 0

    def get_alerts(
        self,
        machine_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Retrieve stored alerts with optional filtering."""
        query = "SELECT * FROM alerts WHERE 1=1"
        params: List[Any] = []

        if machine_id:
            query += " AND machine_id = ?"
            params.append(machine_id)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY timestamp DESC LIMIT ?;"
        params.append(limit)

        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            results = []
            for row in rows:
                item = dict(row)
                if item.get("sensor_evidence_json"):
                    try:
                        item["sensor_evidence"] = json.loads(item["sensor_evidence_json"])
                    except Exception:
                        item["sensor_evidence"] = []
                results.append(item)
            return results

    def log_telemetry(
        self,
        machine_id: str,
        timestamp: datetime,
        vibration_x_rms: Optional[float] = None,
        vibration_y_rms: Optional[float] = None,
        vibration_z_rms: Optional[float] = None,
        bearing_temperature_c: Optional[float] = None,
        motor_current_a: Optional[float] = None,
        rotational_speed_rpm: Optional[float] = None,
        acoustic_emission_db: Optional[float] = None,
        operating_mode: str = "NORMAL",
    ) -> None:
        """Log a telemetry frame for persistent time-series audit."""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO telemetry_log (
                    machine_id, timestamp, vibration_x_rms, vibration_y_rms,
                    vibration_z_rms, bearing_temperature_c, motor_current_a,
                    rotational_speed_rpm, acoustic_emission_db, operating_mode
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                machine_id,
                timestamp.isoformat(),
                vibration_x_rms,
                vibration_y_rms,
                vibration_z_rms,
                bearing_temperature_c,
                motor_current_a,
                rotational_speed_rpm,
                acoustic_emission_db,
                operating_mode,
            ))

    def get_telemetry_history(self, machine_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve historical telemetry samples for a machine."""
        with self._get_connection() as conn:
            rows = conn.execute("""
                SELECT * FROM telemetry_log
                WHERE machine_id = ?
                ORDER BY timestamp DESC
                LIMIT ?;
            """, (machine_id, limit)).fetchall()
            return [dict(row) for row in reversed(rows)]  # Oldest to newest for charts


# Global singleton instance for application use
storage_service = StorageService()
