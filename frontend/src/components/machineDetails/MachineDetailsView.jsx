import React from "react";
import {
  ArrowLeft,
  ChevronDown,
  Activity,
  Thermometer,
  Zap,
  Gauge,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ShieldAlert,
  Info,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";
import LiveSensorCharts from "../overview/LiveSensorCharts";
import SensorPredictionPlayground from "../common/SensorPredictionPlayground";

export default function MachineDetailsView() {
  const {
    machines,
    selectedMachineId,
    setSelectedMachineId,
    setCurrentView,
    alerts,
    acknowledgeAlert,
    resolveAlert,
    setSelectedAlertForModal,
  } = useTelemetry();

  const machine =
    machines.find((m) => m.id === selectedMachineId) || machines[0];

  const machineAlerts = alerts.filter((a) => a.machineId === machine.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Machine Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => setCurrentView("machines")}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-mono text-zinc-300 hover:border-zinc-700 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Fleet Registry</span>
        </button>

        {/* Machine Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">Switch Asset:</span>
          <div className="relative">
            <select
              value={machine.id}
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
        </div>
      </div>

      {/* Main Asset Header Card */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-400">
                {machine.id}
              </span>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                {machine.type}
              </span>
              <StatusBadge status={machine.status} size="md" />
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-mono">
              {machine.name}
            </h1>

            <p className="mt-1 text-xs text-zinc-400">
              Stationed at: <strong className="text-zinc-200">{machine.location}</strong> · Assigned Operator:{" "}
              <strong className="text-zinc-200">{machine.operator}</strong>
            </p>
          </div>

          {/* Health Gauge Box */}
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    machine.healthScore > 80
                      ? "text-emerald-400"
                      : machine.healthScore > 60
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                  strokeDasharray={`${machine.healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute font-mono text-sm font-black text-white">
                {machine.healthScore}%
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Calculated Demo Health Index
              </p>
              <p className="text-xs font-semibold text-white mt-0.5">
                {machine.healthScore > 80
                  ? "Nominal Performance"
                  : machine.healthScore > 60
                  ? "Sub-Optimal / Warning"
                  : "Critical Fault Detected"}
              </p>
              <p className="text-[10px] font-mono text-zinc-500 mt-1">
                Based on multi-modal telemetry inference
              </p>
            </div>
          </div>
        </div>

        {/* Operating Specs Metadata Strip */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-5 sm:grid-cols-4 font-mono text-xs">
          <div className="rounded-lg bg-zinc-950/60 p-3 border border-zinc-800/50">
            <span className="text-zinc-500 text-[10px] uppercase">Runtime Hours</span>
            <p className="mt-1 font-bold text-white text-sm">
              {machine.runtimeHours.toLocaleString()} hrs
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 p-3 border border-zinc-800/50">
            <span className="text-zinc-500 text-[10px] uppercase">Mean Time Between Failures</span>
            <p className="mt-1 font-bold text-white text-sm">
              {machine.mtbfHours.toLocaleString()} hrs (MTBF)
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 p-3 border border-zinc-800/50">
            <span className="text-zinc-500 text-[10px] uppercase">Last Overhaul (Demo)</span>
            <p className="mt-1 font-semibold text-zinc-300 text-sm">
              {machine.lastInspection}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 p-3 border border-zinc-800/50">
            <span className="text-zinc-500 text-[10px] uppercase">Next Scheduled Service</span>
            <p
              className={`mt-1 font-bold text-sm ${
                machine.status === "Critical" ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {machine.nextInspection}
            </p>
          </div>
        </div>
      </section>

      {/* Sensor Channels Live Readings Grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Activity size={14} /> Vibration
            </span>
            <span>lim: {machine.sensors.vibration.threshold}</span>
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-bold ${
              machine.sensors.vibration.status === "critical"
                ? "text-red-400"
                : machine.sensors.vibration.status === "warning"
                ? "text-amber-400"
                : "text-white"
            }`}
          >
            {machine.sensors.vibration.value}
            <span className="ml-1 text-xs font-normal text-zinc-400">mm/s</span>
          </p>
          <p className="mt-1 text-[10px] font-mono text-zinc-500">
            Baseline: {machine.sensors.vibration.baseline} mm/s
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Thermometer size={14} /> Temp
            </span>
            <span>lim: {machine.sensors.temperature.threshold}°C</span>
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-bold ${
              machine.sensors.temperature.status === "critical"
                ? "text-red-400"
                : machine.sensors.temperature.status === "warning"
                ? "text-amber-400"
                : "text-white"
            }`}
          >
            {machine.sensors.temperature.value}
            <span className="ml-1 text-xs font-normal text-zinc-400">°C</span>
          </p>
          <p className="mt-1 text-[10px] font-mono text-zinc-500">
            Baseline: {machine.sensors.temperature.baseline}°C
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Zap size={14} /> Current
            </span>
            <span>lim: {machine.sensors.current.threshold} A</span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-white">
            {machine.sensors.current.value}
            <span className="ml-1 text-xs font-normal text-zinc-400">A</span>
          </p>
          <p className="mt-1 text-[10px] font-mono text-zinc-500">
            Baseline: {machine.sensors.current.baseline} A
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-purple-400">
              <Gauge size={14} /> Shaft Speed
            </span>
            <span>lim: {machine.sensors.rpm.threshold}</span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-white">
            {machine.sensors.rpm.value}
            <span className="ml-1 text-xs font-normal text-zinc-400">RPM</span>
          </p>
          <p className="mt-1 text-[10px] font-mono text-zinc-500">
            Baseline: {machine.sensors.rpm.baseline} RPM
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Clock size={14} /> Pressure
            </span>
            <span>lim: {machine.sensors.pressure.threshold}</span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-white">
            {machine.sensors.pressure.value}
            <span className="ml-1 text-xs font-normal text-zinc-400">bar</span>
          </p>
          <p className="mt-1 text-[10px] font-mono text-zinc-500">
            Baseline: {machine.sensors.pressure.baseline} bar
          </p>
        </div>
      </section>

      {/* Real-time Time Series Sensor Chart for this machine */}
      <section>
        <LiveSensorCharts machineIdOverride={machine.id} showMachineSelector={false} />
      </section>

      {/* Manual Sensor Input & What-If Prediction Playground */}
      <section>
        <SensorPredictionPlayground initialMachineId={machine.id} key={machine.id} />
      </section>

      {/* Maintenance Recommendations & Machine Alert History */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Predictive Maintenance Recommendations */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-cyan-400" />
              <h3 className="text-base font-bold text-white">Predictive Maintenance Guidance</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Illustrative Recommendations</span>
          </div>

          <div className="mt-4 space-y-3">
            {machine.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition hover:border-zinc-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-bold ${
                      rec.priority === "Critical"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : rec.priority === "High"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    Priority: {rec.priority}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">{rec.timeframe}</span>
                </div>
                <p className="mt-2.5 text-xs text-zinc-200 leading-relaxed">{rec.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-950/20 p-3.5 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-blue-300">Operational Disclaimer: </strong>
            Sensor deviations identify abnormal operational conditions and statistical anomalies;
            physical teardown inspection by certified personnel is required prior to component replacement.
          </div>
        </div>

        {/* Machine Alert History */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-400" />
              <h3 className="text-base font-bold text-white">Machine-Specific Alert History</h3>
            </div>
            <span className="font-mono text-xs text-zinc-400">{machineAlerts.length} recorded</span>
          </div>

          <div className="mt-4 space-y-3">
            {machineAlerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500 font-mono">
                No active or historical alerts logged for this asset.
              </div>
            ) : (
              machineAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 transition hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-400">{alert.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-500">{alert.timestamp}</span>
                      <StatusBadge status={alert.severity} size="sm" />
                      <StatusBadge status={alert.status} size="sm" />
                    </div>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-amber-200">{alert.faultType}</h4>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{alert.explanation}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs font-mono">
                    <button
                      onClick={() => setSelectedAlertForModal(alert)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      Inspect Anomaly →
                    </button>

                    <div className="flex gap-2">
                      {alert.status === "Open" && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300 hover:bg-blue-500/20"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== "Resolved" && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/20"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
