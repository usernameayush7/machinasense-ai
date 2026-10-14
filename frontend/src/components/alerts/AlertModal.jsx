import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  ShieldAlert,
  ArrowRight,
  Printer,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";

export default function AlertModal() {
  const {
    selectedAlertForModal,
    setSelectedAlertForModal,
    acknowledgeAlert,
    resolveAlert,
    viewMachineDetails,
  } = useTelemetry();

  const [checklist, setChecklist] = useState({
    lockout: false,
    visual: false,
    sensors: false,
    lubricant: false,
  });

  if (!selectedAlertForModal) return null;

  const alert = selectedAlertForModal;

  const toggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => setSelectedAlertForModal(null)}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                alert.severity === "Critical"
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              }`}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-400">{alert.id}</span>
                <StatusBadge status={alert.severity} size="sm" />
                <StatusBadge status={alert.status} size="sm" />
              </div>
              <h3 className="mt-1 text-lg font-bold text-white leading-snug">
                {alert.faultType}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setSelectedAlertForModal(null)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Target Machine & Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <div>
              <p className="text-[11px] font-mono text-zinc-400 uppercase">Affected Equipment</p>
              <p className="text-sm font-bold text-white mt-0.5">{alert.machineName}</p>
              <p className="text-xs font-mono text-cyan-400">{alert.machineId}</p>
            </div>

            <div className="flex gap-4 font-mono text-xs text-zinc-300">
              <div>
                <p className="text-[11px] text-zinc-400">Timestamp</p>
                <p className="font-semibold text-white">{alert.timestamp}</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-400">Work Order</p>
                <p className="text-cyan-400 font-semibold">{alert.workOrder}</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-400">Model Confidence</p>
                <p className="text-emerald-400 font-semibold">{alert.confidence}</p>
              </div>
            </div>

            <button
              onClick={() => {
                viewMachineDetails(alert.machineId);
                setSelectedAlertForModal(null);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              Open Telemetry <ArrowRight size={14} />
            </button>
          </div>

          {/* Sensor Evidence Analysis */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Sparkles size={14} /> Sensor Deviation Evidence
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3">
                <span className="text-zinc-400">Observed Sensor Metric:</span>
                <p className="mt-1 font-mono text-sm font-bold text-red-400">
                  {alert.observedValue}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3">
                <span className="text-zinc-400">Nominal Baseline Range:</span>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-400">
                  {alert.expectedRange}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed pt-1">
              <strong className="text-white">Diagnostic Summary: </strong>
              {alert.explanation}
            </p>
          </div>

          {/* Recommended Inspection Actions Checklist */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ClipboardCheck size={15} /> Required Maintenance Protocol
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">Hypothetical Protocol</span>
            </div>

            <div className="space-y-2 text-xs">
              <label
                onClick={() => toggleCheck("lockout")}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition"
              >
                <input
                  type="checkbox"
                  checked={checklist.lockout}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                />
                <span className={checklist.lockout ? "line-through text-zinc-500" : "text-zinc-200"}>
                  Verify LOTO (Lockout / Tagout) safety procedure and confirm zero electrical energy.
                </span>
              </label>

              <label
                onClick={() => toggleCheck("visual")}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition"
              >
                <input
                  type="checkbox"
                  checked={checklist.visual}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                />
                <span className={checklist.visual ? "line-through text-zinc-500" : "text-zinc-200"}>
                  Conduct visual borescope and thermal camera examination on housing.
                </span>
              </label>

              <label
                onClick={() => toggleCheck("sensors")}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition"
              >
                <input
                  type="checkbox"
                  checked={checklist.sensors}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                />
                <span className={checklist.sensors ? "line-through text-zinc-500" : "text-zinc-200"}>
                  Execute FFT vibration spectrum sweep and check accelerometer calibration.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/60 p-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-700"
          >
            <Printer size={14} /> Print Work Order
          </button>

          <div className="flex items-center gap-2">
            {alert.status === "Open" && (
              <button
                onClick={() => {
                  acknowledgeAlert(alert.id);
                  setSelectedAlertForModal(null);
                }}
                className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-mono font-medium text-blue-300 hover:bg-blue-500/20 transition"
              >
                Acknowledge Alert
              </button>
            )}

            {alert.status !== "Resolved" ? (
              <button
                onClick={() => {
                  resolveAlert(alert.id);
                  setSelectedAlertForModal(null);
                }}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-mono font-medium text-emerald-300 hover:bg-emerald-500/30 transition shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                Mark Resolved
              </button>
            ) : (
              <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={16} /> Resolved & Cleared
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
