import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Activity,
  Thermometer,
  Zap,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useTelemetry, TIME_RANGES } from "../../context/TelemetryContext";

export default function LiveSensorCharts({
  machineIdOverride = null,
  showMachineSelector = true,
}) {
  const {
    machines,
    selectedMachineId,
    setSelectedMachineId,
    telemetryBuffers,
    timeRange,
    setTimeRange,
    isLive,
    setIsLive,
  } = useTelemetry();

  const activeMachineId = machineIdOverride || selectedMachineId;
  const currentMachine =
    machines.find((m) => m.id === activeMachineId) || machines[0];
  const chartData = telemetryBuffers[activeMachineId] || [];

  const [activeSensorTab, setActiveSensorTab] = useState("all"); // 'vibration', 'temperature', 'current', 'all'

  const sensorsMeta = {
    vibration: {
      name: "Vibration",
      unit: "mm/s",
      color: "#22d3ee", // Electric Cyan
      gradientFrom: "rgba(34, 211, 238, 0.3)",
      threshold: currentMachine.sensors.vibration.threshold,
      currentVal: currentMachine.sensors.vibration.value,
      icon: Activity,
    },
    temperature: {
      name: "Temperature",
      unit: "°C",
      color: "#f59e0b", // Amber
      gradientFrom: "rgba(245, 158, 11, 0.3)",
      threshold: currentMachine.sensors.temperature.threshold,
      currentVal: currentMachine.sensors.temperature.value,
      icon: Thermometer,
    },
    current: {
      name: "Motor Current",
      unit: "A",
      color: "#38bdf8", // Cool Blue
      gradientFrom: "rgba(56, 189, 248, 0.3)",
      threshold: currentMachine.sensors.current.threshold,
      currentVal: currentMachine.sensors.current.value,
      icon: Zap,
    },
  };

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const currentPoint = chartData.find((d) => d.time === label) || {};

    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs z-50">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-2 mb-2">
          <span className="text-zinc-400">{label}</span>
          {currentPoint.isAnomaly && (
            <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[10px] text-red-300 font-bold uppercase animate-pulse">
              ANOMALY TRIGGER
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {entry.value}{" "}
                <span className="text-[10px] font-normal text-zinc-400">
                  {entry.unit}
                </span>
              </span>
            </div>
          ))}
        </div>

        {currentPoint.anomalyLabel && (
          <p className="mt-2 text-[10px] text-amber-300 border-t border-zinc-800/80 pt-1.5">
            Diagnostic: {currentPoint.anomalyLabel}
          </p>
        )}
      </div>
    );
  };

  // Custom Dot for anomaly flag
  const renderAnomalyDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.isAnomaly) return null;
    return (
      <g key={`dot-${cx}-${cy}`}>
        <circle
          cx={cx}
          cy={cy}
          r={7}
          fill="rgba(239, 68, 68, 0.3)"
          className="animate-ping"
        />
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 md:p-6 backdrop-blur-md">
      {/* Top Header & Machine Selector Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-400">
              HIGH-FREQUENCY TELEMETRY
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Sampling: 3.3s tick
            </span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-white">
            Sensor Time-Series Diagnostics
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time simulated telemetry stream with threshold reference lines & anomaly markers.
          </p>
        </div>

        {/* Right side controls: Machine Switcher + Time Range + Feed Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {showMachineSelector && (
            <div className="relative">
              <select
                value={activeMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="appearance-none rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-1.5 pr-8 text-xs font-mono font-medium text-zinc-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name} ({m.status})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          )}

          {/* Time range selector */}
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {Object.keys(TIME_RANGES).map((rangeKey) => (
              <button
                key={rangeKey}
                onClick={() => setTimeRange(rangeKey)}
                className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                  timeRange === rangeKey
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {TIME_RANGES[rangeKey].label}
              </button>
            ))}
          </div>

          {/* Play/Pause Feed Button */}
          <button
            onClick={() => setIsLive((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono font-medium transition ${
              isLive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            {isLive ? <Pause size={13} /> : <Play size={13} />}
            <span>{isLive ? "Pause Feed" : "Resume Feed"}</span>
          </button>
        </div>
      </div>

      {/* Sensor Quick Stats Badges & Tab Switcher */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Object.entries(sensorsMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          const isBreached = meta.currentVal > meta.threshold;
          const isSelected = activeSensorTab === key;

          return (
            <button
              key={key}
              onClick={() => setActiveSensorTab(key)}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                  : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Icon size={14} style={{ color: meta.color }} />
                  {meta.name}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isBreached
                      ? "bg-red-500/20 text-red-400 border border-red-500/30 font-bold"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {isBreached ? "EXCEEDED" : "NOMINAL"}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold font-mono text-white">
                  {meta.currentVal}{" "}
                  <span className="text-xs font-normal text-zinc-400 font-sans">
                    {meta.unit}
                  </span>
                </div>
                <div className="text-right text-[11px] font-mono text-zinc-500">
                  Limit: {meta.threshold} {meta.unit}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* View Filter Pill Switcher */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono">Chart Mode:</span>
          <div className="flex gap-1 rounded-lg bg-zinc-950 p-1 border border-zinc-800">
            <button
              onClick={() => setActiveSensorTab("all")}
              className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                activeSensorTab === "all"
                  ? "bg-zinc-800 text-cyan-300 font-semibold"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Synchronized Multi-Sensor
            </button>
            <button
              onClick={() => setActiveSensorTab("vibration")}
              className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                activeSensorTab === "vibration"
                  ? "bg-zinc-800 text-cyan-300 font-semibold"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Vibration Only
            </button>
            <button
              onClick={() => setActiveSensorTab("temperature")}
              className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                activeSensorTab === "temperature"
                  ? "bg-zinc-800 text-amber-300 font-semibold"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Temperature Only
            </button>
            <button
              onClick={() => setActiveSensorTab("current")}
              className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                activeSensorTab === "current"
                  ? "bg-zinc-800 text-sky-300 font-semibold"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Current Only
            </button>
          </div>
        </div>

        {/* Legend Notes */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-3 bg-red-500/80 inline-block" /> Threshold Line
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Anomaly Marker
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="mt-4 h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs">
            No telemetry stream available for selected window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="vibGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#27272a"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={{ stroke: "#3f3f46" }}
                minTickGap={40}
              />

              <YAxis
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: "10px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />

              {/* Threshold Lines */}
              {(activeSensorTab === "all" || activeSensorTab === "vibration") && (
                <ReferenceLine
                  y={sensorsMeta.vibration.threshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Vib Threshold (${sensorsMeta.vibration.threshold} mm/s)`,
                    fill: "#ef4444",
                    fontSize: 10,
                    position: "insideTopRight",
                    fontFamily: "monospace",
                  }}
                />
              )}

              {(activeSensorTab === "temperature") && (
                <ReferenceLine
                  y={sensorsMeta.temperature.threshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Temp Threshold (${sensorsMeta.temperature.threshold} °C)`,
                    fill: "#ef4444",
                    fontSize: 10,
                    position: "insideTopRight",
                    fontFamily: "monospace",
                  }}
                />
              )}

              {(activeSensorTab === "current") && (
                <ReferenceLine
                  y={sensorsMeta.current.threshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Current Threshold (${sensorsMeta.current.threshold} A)`,
                    fill: "#ef4444",
                    fontSize: 10,
                    position: "insideTopRight",
                    fontFamily: "monospace",
                  }}
                />
              )}

              {/* Lines based on tab */}
              {(activeSensorTab === "all" || activeSensorTab === "vibration") && (
                <Line
                  type="monotone"
                  dataKey="vibration"
                  name="Vibration (mm/s)"
                  unit="mm/s"
                  stroke={sensorsMeta.vibration.color}
                  strokeWidth={2.5}
                  dot={renderAnomalyDot}
                  activeDot={{
                    r: 5,
                    stroke: "#22d3ee",
                    strokeWidth: 2,
                    fill: "#09090b",
                  }}
                  isAnimationActive={false}
                />
              )}

              {(activeSensorTab === "all" || activeSensorTab === "temperature") && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  unit="°C"
                  stroke={sensorsMeta.temperature.color}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: "#f59e0b",
                    strokeWidth: 2,
                    fill: "#09090b",
                  }}
                  isAnimationActive={false}
                />
              )}

              {(activeSensorTab === "all" || activeSensorTab === "current") && (
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Current (A)"
                  unit="A"
                  stroke={sensorsMeta.current.color}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: "#38bdf8",
                    strokeWidth: 2,
                    fill: "#09090b",
                  }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Status Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4 text-xs font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>
            Displaying {chartData.length} active frames for{" "}
            <strong className="text-zinc-300">{currentMachine.name}</strong>
          </span>
        </div>
        <span className="text-zinc-400">
          Status:{" "}
          <strong
            className={
              currentMachine.status === "Critical"
                ? "text-red-400"
                : currentMachine.status === "Warning"
                ? "text-amber-400"
                : "text-emerald-400"
            }
          >
            {currentMachine.status} (Health: {currentMachine.healthScore}%)
          </strong>
        </span>
      </div>
    </div>
  );
}
