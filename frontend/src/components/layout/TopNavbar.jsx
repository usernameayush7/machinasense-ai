import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  Play,
  Pause,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  ArrowRight
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";

export default function TopNavbar({ onOpenSidebar }) {
  const {
    currentView,
    setCurrentView,
    isLive,
    setIsLive,
    lastUpdated,
    alerts,
    machines,
    viewMachineDetails,
    setSelectedAlertForModal,
    setIsNotificationDrawerOpen,
    activeAnomalies,
    criticalAlerts
  } = useTelemetry();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  // Close search suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titles = {
    overview: "Industrial Intelligence Center",
    machines: "Equipment Fleet Registry",
    "machine-details": "Individual Machine Diagnostics",
    alerts: "Anomaly Alert Investigation",
    analytics: "Model Performance & Robustness Lab",
    explorer: "Raw Telemetry & Synthetic Injection",
    settings: "System Configuration & Integration",
  };

  const breadcrumbs = {
    overview: ["Plant 01", "Overview"],
    machines: ["Plant 01", "Machinery Fleet"],
    "machine-details": ["Plant 01", "Machines", "Diagnostics"],
    alerts: ["Diagnostics", "Anomaly Alerts"],
    analytics: ["ML Engine", "Evaluation & Robustness"],
    explorer: ["Data Pipeline", "Telemetry Explorer"],
    settings: ["System", "Configuration"],
  };

  // Filter machines and alerts for live search
  const filteredMachines = query.trim()
    ? machines.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.id.toLowerCase().includes(query.toLowerCase()) ||
          m.type.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredAlerts = query.trim()
    ? alerts.filter(
        (a) =>
          a.machineName.toLowerCase().includes(query.toLowerCase()) ||
          a.id.toLowerCase().includes(query.toLowerCase()) ||
          a.faultType.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur-xl md:px-8">
      {/* Left Breadcrumb & Mobile Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            {breadcrumbs[currentView]?.map((item, idx, arr) => (
              <React.Fragment key={idx}>
                <span
                  className={
                    idx === arr.length - 1
                      ? "text-cyan-400 font-medium"
                      : "hover:text-zinc-200 transition-colors"
                  }
                >
                  {item}
                </span>
                {idx < arr.length - 1 && (
                  <ChevronRight size={12} className="text-zinc-600" />
                )}
              </React.Fragment>
            ))}
          </nav>
          <h2 className="text-lg font-bold text-white tracking-tight hidden sm:block">
            {titles[currentView] || "MachinaSense"}
          </h2>
        </div>
      </div>

      {/* Right Controls Area */}
      <div className="flex items-center gap-3">
        {/* Search Field with Dropdown */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search equipment or alerts..."
              className="w-56 rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 lg:w-72"
            />
          </div>

          {/* Quick Search Dropdown */}
          {searchOpen && query.trim() && (
            <div className="absolute left-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-xl z-50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                Matching Equipment ({filteredMachines.length})
              </div>
              {filteredMachines.length > 0 ? (
                <div className="space-y-1 mb-3">
                  {filteredMachines.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        viewMachineDetails(m.id);
                        setSearchOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs hover:bg-zinc-800 transition"
                    >
                      <div>
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="font-mono text-[10px] text-zinc-400">{m.id} · {m.type}</p>
                      </div>
                      <span className="font-mono text-cyan-400 flex items-center text-[11px]">
                        Inspect <ArrowRight size={12} className="ml-1" />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic mb-3">No machines match "{query}"</p>
              )}

              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 pt-2 border-t border-zinc-800">
                Matching Alerts ({filteredAlerts.length})
              </div>
              {filteredAlerts.length > 0 ? (
                <div className="space-y-1">
                  {filteredAlerts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedAlertForModal(a);
                        setSearchOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs hover:bg-zinc-800 transition"
                    >
                      <div>
                        <p className="font-medium text-amber-300">{a.faultType}</p>
                        <p className="font-mono text-[10px] text-zinc-400">{a.id} · {a.machineName}</p>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {a.severity}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No alerts match "{query}"</p>
              )}
            </div>
          )}
        </div>

        {/* Live Simulation Play/Pause Toggle */}
        <button
          onClick={() => setIsLive((prev) => !prev)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono font-medium transition-all ${
            isLive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          }`}
          title={isLive ? "Click to Pause live simulated telemetry feed" : "Click to Resume live feed"}
        >
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="hidden sm:inline">LIVE FEED</span>
              <Pause size={12} className="opacity-70 ml-0.5" />
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>FEED PAUSED</span>
              <Play size={12} className="opacity-70 ml-0.5" />
            </>
          )}
        </button>

        {/* Quick Inference Lab Shortcut */}
        <button
          onClick={() => setCurrentView("explorer")}
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-500/20 transition shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          title="Open Manual Sensor Input & Predictive Inference Lab"
        >
          <Sparkles size={13} className="text-cyan-400" />
          <span>Inference Lab</span>
        </button>

        {/* Demo Mode Badge */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 text-[11px] font-mono text-cyan-400">
          <Sparkles size={13} className="text-cyan-400" />
          <span>SIMULATION MODE</span>
        </div>

        {/* Clock */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-mono text-zinc-400">
          <Clock size={13} />
          <span>{lastUpdated.toLocaleTimeString()}</span>
        </div>

        {/* Notifications Icon with Pill Counter */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="relative rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          {activeAnomalies > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-mono font-bold text-white ${
                criticalAlerts > 0 ? "bg-red-500 animate-pulse" : "bg-amber-500"
              }`}
            >
              {activeAnomalies}
            </span>
          )}
        </button>

        {/* Profile Avatar Placeholder */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 text-white font-bold text-xs shadow-md">
            SL
          </div>
          <div className="hidden 2xl:block text-left">
            <p className="text-xs font-medium text-white leading-tight">Shift Lead A-04</p>
            <p className="text-[10px] font-mono text-cyan-400 leading-tight">Plant Ops</p>
          </div>
        </div>
      </div>
    </header>
  );
}
