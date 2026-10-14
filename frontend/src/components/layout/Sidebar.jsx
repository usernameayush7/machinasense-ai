import React from "react";
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Activity,
  Database,
  Sliders,
  Radio,
  CheckCircle2,
  X
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";

export default function Sidebar({ isOpen, onClose }) {
  const { currentView, setCurrentView, activeAnomalies, criticalAlerts, isLive } = useTelemetry();

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "machines", label: "Machines", icon: Cpu, badge: "5 Fleet" },
    {
      id: "alerts",
      label: "Anomaly Alerts",
      icon: AlertTriangle,
      badge: activeAnomalies > 0 ? `${activeAnomalies} Active` : null,
      badgeColor: criticalAlerts > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
    },
    { id: "analytics", label: "Analytics & Evaluation", icon: Activity, badge: "F1: 96%" },
    { id: "explorer", label: "Data Explorer & Lab", icon: Database, badge: "Inference Lab", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-zinc-800/60 px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Radio className="text-zinc-950" size={22} />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-white font-mono">
                  Machina<span className="text-cyan-400">Sense</span>
                </h1>
                <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                INDUSTRIAL INTELLIGENCE
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 pb-3 text-[11px] font-mono font-semibold tracking-wider text-zinc-500 uppercase">
            Control Room Navigation
          </p>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                      : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  {/* Left accent bar on active */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      size={19}
                      className={`transition-colors ${
                        isActive
                          ? "text-cyan-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-mono ${
                        item.badgeColor ||
                        (isActive
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Plant Summary Mini Card */}
          <div className="mt-8 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-400">PLANT ZONE ALPHA</span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Total Monitored:</span>
                <span className="font-mono text-zinc-200">5 Machines</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Active Channels:</span>
                <span className="font-mono text-zinc-200">15 Sensors</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Telemetry Ingestion:</span>
                <span className="font-mono text-cyan-400">{isLive ? "3,330 sps (Live)" : "PAUSED"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom System Operational Badge */}
        <div className="border-t border-zinc-800/70 p-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={16} />
                <span className="text-xs font-semibold tracking-wide">
                  Engine Operational
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">99.98% SLA</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
              Demo environment with high-fidelity simulated telemetry.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
