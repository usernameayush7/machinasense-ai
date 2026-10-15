import React from "react";
import { X, AlertTriangle, CheckCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";

export default function NotificationDrawer() {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    alerts,
    acknowledgeAlert,
    resolveAlert,
    setSelectedAlertForModal,
    setCurrentView,
  } = useTelemetry();

  if (!isNotificationDrawerOpen) return null;

  const activeAlerts = alerts.filter((a) => a.status !== "Resolved");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsNotificationDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Active Anomaly Alarms</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {activeAlerts.length} unresolved alerts detected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsNotificationDrawerOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* List */}
          <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
            {activeAlerts.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center">
                <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-white">All Alarms Clear</p>
                <p className="text-xs text-zinc-400 mt-1">
                  All equipment sensors operating within expected parameters.
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 transition-all ${
                    alert.severity === "Critical"
                      ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                      : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-400">{alert.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">{alert.timestamp}</span>
                      <StatusBadge status={alert.severity} size="sm" />
                    </div>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-white">{alert.machineName}</h4>
                  <p className="text-xs font-medium text-amber-300 mt-0.5">{alert.faultType}</p>
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{alert.explanation}</p>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-3 text-xs">
                    <button
                      onClick={() => {
                        setSelectedAlertForModal(alert);
                        setIsNotificationDrawerOpen(false);
                      }}
                      className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Investigate <ArrowRight size={12} />
                    </button>

                    <div className="flex gap-2">
                      {alert.status === "Open" && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] font-mono text-blue-300 hover:bg-blue-500/20"
                        >
                          Ack
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-mono text-emerald-300 hover:bg-emerald-500/20"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950 p-4">
            <button
              onClick={() => {
                setCurrentView("alerts");
                setIsNotificationDrawerOpen(false);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-center text-xs font-mono font-bold text-zinc-950 hover:brightness-110 transition"
            >
              OPEN FULL ALERTS CENTER →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
