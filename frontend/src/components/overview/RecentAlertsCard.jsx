import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Filter,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";

export default function RecentAlertsCard({ limit = 3 }) {
  const { alerts, acknowledgeAlert, resolveAlert, setSelectedAlertForModal, setCurrentView } =
    useTelemetry();

  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE, ALL, RESOLVED

  const filtered = alerts.filter((a) => {
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    if (statusFilter === "ACTIVE" && a.status === "Resolved") return false;
    if (statusFilter === "RESOLVED" && a.status !== "Resolved") return false;
    return true;
  });

  const displayAlerts = filtered.slice(0, limit);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 md:p-6 backdrop-blur-md">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Active Anomaly Alerts</h3>
            <p className="text-xs text-zinc-400">
              Pattern deviations detected across vibration & thermal signatures.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs font-mono">
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`rounded px-2 py-0.5 transition ${
                statusFilter === "ACTIVE"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`rounded px-2 py-0.5 transition ${
                statusFilter === "ALL"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={() => setCurrentView("alerts")}
            className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
          >
            View All ({alerts.length}) <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="mt-4 space-y-3.5">
        {displayAlerts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-6 text-center text-xs text-zinc-500 font-mono">
            No alerts matching current filter parameters.
          </div>
        ) : (
          displayAlerts.map((alert) => {
            const isCrit = alert.severity === "Critical";

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 transition-all ${
                  isCrit
                    ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                    : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400 font-semibold">{alert.id}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs font-bold text-white">{alert.machineName}</span>
                    <span className="font-mono text-[10px] text-zinc-400">({alert.machineId})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">{alert.timestamp}</span>
                    <StatusBadge status={alert.severity} size="sm" />
                    <StatusBadge status={alert.status} size="sm" />
                  </div>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-sm font-bold text-amber-200">{alert.faultType}</h4>
                  <p className="mt-1 text-xs text-zinc-300 leading-relaxed">{alert.explanation}</p>
                </div>

                {/* Evidence snippet */}
                <div className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-2.5 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="text-zinc-400">
                    Evidence: <strong className="text-red-400">{alert.observedValue}</strong>
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Confidence: <span className="text-emerald-400 font-semibold">{alert.confidence}</span>
                  </span>
                </div>

                {/* Actions row */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/60 pt-3 text-xs font-mono">
                  <button
                    onClick={() => setSelectedAlertForModal(alert)}
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <Eye size={14} />
                    <span>Investigate Diagnostics</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {alert.status === "Open" && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="rounded-md border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300 hover:bg-blue-500/20"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== "Resolved" ? (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/20"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 size={13} /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
