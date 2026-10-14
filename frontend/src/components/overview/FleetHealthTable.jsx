import React from "react";
import { ArrowUpRight, Cpu, Thermometer, Activity, Zap, ChevronRight } from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";

export default function FleetHealthTable() {
  const { machines, viewMachineDetails, lastUpdated } = useTelemetry();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 p-5 md:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" />
            <h3 className="text-base font-bold text-white">Machine Fleet Condition Matrix</h3>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time physical telemetry parameters across monitored plant assets.
          </p>
        </div>

        <span className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-mono text-zinc-400">
          5 Assets Synchronized
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs font-mono">
          <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-5">Equipment & Tag</th>
              <th className="py-3.5 px-4">Condition</th>
              <th className="py-3.5 px-4">Health Index</th>
              <th className="py-3.5 px-4">Vibration</th>
              <th className="py-3.5 px-4">Temp</th>
              <th className="py-3.5 px-4">Current</th>
              <th className="py-3.5 px-4">Trend (1h)</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {machines.map((m) => {
              const isCrit = m.status === "Critical";
              const isWarn = m.status === "Warning";

              return (
                <tr
                  key={m.id}
                  onClick={() => viewMachineDetails(m.id)}
                  className="group hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  {/* Name and Tag */}
                  <td className="py-4 px-5">
                    <div className="font-sans font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {m.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      <span className="text-cyan-400">{m.id}</span> · {m.type}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <StatusBadge status={m.status} size="sm" />
                  </td>

                  {/* Health Score */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-16 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            m.healthScore > 80
                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                              : m.healthScore > 60
                              ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                              : "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                          }`}
                          style={{ width: `${m.healthScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-white">{m.healthScore}%</span>
                    </div>
                  </td>

                  {/* Vibration */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-semibold ${
                          m.sensors.vibration.status === "critical"
                            ? "text-red-400 font-bold"
                            : m.sensors.vibration.status === "warning"
                            ? "text-amber-400"
                            : "text-zinc-200"
                        }`}
                      >
                        {m.sensors.vibration.value} {m.sensors.vibration.unit}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      lim: {m.sensors.vibration.threshold}
                    </span>
                  </td>

                  {/* Temperature */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-semibold ${
                          m.sensors.temperature.status === "critical"
                            ? "text-red-400 font-bold"
                            : m.sensors.temperature.status === "warning"
                            ? "text-amber-400"
                            : "text-zinc-200"
                        }`}
                      >
                        {m.sensors.temperature.value} {m.sensors.temperature.unit}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      lim: {m.sensors.temperature.threshold}
                    </span>
                  </td>

                  {/* Current */}
                  <td className="py-4 px-4">
                    <span
                      className={`font-semibold ${
                        m.sensors.current.status === "warning"
                          ? "text-amber-400"
                          : "text-zinc-200"
                      }`}
                    >
                      {m.sensors.current.value} {m.sensors.current.unit}
                    </span>
                  </td>

                  {/* Sparkline visualization */}
                  <td className="py-4 px-4">
                    <div className="flex h-6 w-24 items-end gap-1">
                      {m.sparkline.map((val, idx) => {
                        const maxVal = Math.max(...m.sparkline);
                        const minVal = Math.min(...m.sparkline);
                        const pct = Math.max(15, Math.min(100, Math.round(((val - minVal) / (maxVal - minVal || 1)) * 85 + 15)));

                        return (
                          <div
                            key={idx}
                            style={{ height: `${pct}%` }}
                            className={`flex-1 rounded-t-xs ${
                              isCrit
                                ? "bg-red-400/80"
                                : isWarn
                                ? "bg-amber-400/80"
                                : "bg-emerald-400/70"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewMachineDetails(m.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-[11px] text-zinc-300 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 group-hover:text-cyan-300 transition"
                    >
                      <span>Diagnostics</span>
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
