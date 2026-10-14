import React, { useState } from "react";
import {
  Search,
  Filter,
  Cpu,
  ArrowUpDown,
  RotateCw,
  ChevronRight,
  Activity,
  Thermometer,
  Zap,
  Gauge,
  SlidersHorizontal,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";

export default function MachinesView() {
  const {
    machines,
    activeFilterStatus,
    setActiveFilterStatus,
    viewMachineDetails,
    lastUpdated,
  } = useTelemetry();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("healthAsc"); // healthAsc, healthDesc, name, id
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 450);
  };

  // Filter machines
  const filtered = machines.filter((m) => {
    const matchesStatus =
      activeFilterStatus === "ALL" ||
      m.status.toLowerCase() === activeFilterStatus.toLowerCase();

    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Sort machines
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "healthAsc") return a.healthScore - b.healthScore;
    if (sortBy === "healthDesc") return b.healthScore - a.healthScore;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Plant Assets Registry
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
            Industrial Equipment Fleet
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time condition monitoring, operating hours, and live sensor summaries across all production lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateRefresh}
            className={`flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 hover:text-white transition ${
              isRefreshing ? "opacity-50" : ""
            }`}
          >
            <RotateCw size={13} className={isRefreshing ? "animate-spin text-cyan-400" : ""} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by machine name, ID, bay, or category..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs font-mono">
          {["ALL", "Healthy", "Warning", "Critical"].map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilterStatus(st)}
              className={`rounded px-3 py-1.5 transition ${
                activeFilterStatus === st
                  ? "bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <ArrowUpDown size={14} className="text-zinc-500" />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="healthAsc">Lowest Health Score First</option>
            <option value="healthDesc">Highest Health Score First</option>
            <option value="name">Machine Name (A-Z)</option>
            <option value="id">Machine ID</option>
          </select>
        </div>
      </div>

      {/* Machine Cards Grid */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-400 font-mono text-xs">
          No equipment found matching criteria "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((m) => {
            const isCrit = m.status === "Critical";
            const isWarn = m.status === "Warning";

            return (
              <div
                key={m.id}
                onClick={() => viewMachineDetails(m.id)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl ${
                  isCrit
                    ? "border-red-500/30 hover:border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                    : isWarn
                    ? "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                    : "border-zinc-800/80 hover:border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {m.id}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {m.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{m.type} · {m.location}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  {/* Health Score Meter */}
                  <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Health Index</span>
                      <span
                        className={`font-extrabold ${
                          m.healthScore > 80
                            ? "text-emerald-400"
                            : m.healthScore > 60
                            ? "text-amber-400"
                            : "text-red-400 font-bold animate-pulse"
                        }`}
                      >
                        {m.healthScore}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          m.healthScore > 80
                            ? "bg-emerald-400"
                            : m.healthScore > 60
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${m.healthScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Sensor Channels Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-2">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1">
                        <Activity size={10} className="text-cyan-400" /> Vib
                      </span>
                      <p
                        className={`mt-1 font-bold ${
                          m.sensors.vibration.status === "critical"
                            ? "text-red-400"
                            : "text-zinc-200"
                        }`}
                      >
                        {m.sensors.vibration.value}
                      </p>
                      <span className="text-[9px] text-zinc-500">mm/s</span>
                    </div>

                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-2">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1">
                        <Thermometer size={10} className="text-amber-400" /> Temp
                      </span>
                      <p
                        className={`mt-1 font-bold ${
                          m.sensors.temperature.status === "critical"
                            ? "text-red-400"
                            : "text-zinc-200"
                        }`}
                      >
                        {m.sensors.temperature.value}°
                      </p>
                      <span className="text-[9px] text-zinc-500">°C</span>
                    </div>

                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-2">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center justify-center gap-1">
                        <Zap size={10} className="text-sky-400" /> Amps
                      </span>
                      <p className="mt-1 font-bold text-zinc-200">
                        {m.sensors.current.value}
                      </p>
                      <span className="text-[9px] text-zinc-500">A</span>
                    </div>
                  </div>

                  {/* Operating Metadata */}
                  <div className="mt-4 space-y-1.5 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/60 pt-3">
                    <div className="flex justify-between">
                      <span>Runtime Hours:</span>
                      <span className="text-zinc-300">{m.runtimeHours.toLocaleString()} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Inspection:</span>
                      <span className={isCrit ? "text-red-400 font-bold" : "text-zinc-300"}>
                        {m.nextInspection}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">
                    Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 transition-colors font-medium">
                    Diagnostics <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
