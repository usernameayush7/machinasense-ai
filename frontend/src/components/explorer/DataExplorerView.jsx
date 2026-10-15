import React, { useState } from "react";
import {
  Database,
  Radio,
  Play,
  Pause,
  Download,
  AlertTriangle,
  Upload,
  Cpu,
  Sparkles,
  Flame,
  Zap,
  Activity,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import SensorPredictionPlayground from "../common/SensorPredictionPlayground";

export default function DataExplorerView() {
  const {
    telemetryBuffers,
    machines,
    selectedMachineId,
    setSelectedMachineId,
    injectSyntheticAnomaly,
    isLive,
    setIsLive,
  } = useTelemetry();

  const [activeTab, setActiveTab] = useState("predictor"); // 'predictor', 'stream', 'injector', 'all'
  const [targetInjectionMachine, setTargetInjectionMachine] = useState("CNC-001");
  const [filterQuery, setFilterQuery] = useState("");
  const [showInjectedNotice, setShowInjectedNotice] = useState(null);

  const activeBuffer = telemetryBuffers[selectedMachineId] || [];
  const currentMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  const handleInject = (type) => {
    injectSyntheticAnomaly(type, targetInjectionMachine);
    setShowInjectedNotice(`Injected ${type.toUpperCase()} anomaly event on ${targetInjectionMachine}`);
    setTimeout(() => setShowInjectedNotice(null), 4000);
  };

  const exportTelemetryCSV = () => {
    const headers = "Timestamp,RawTime,MachineID,MachineName,Vibration_mm_s,Temperature_C,Current_A,IsAnomaly,AnomalyType\n";
    const rows = activeBuffer
      .map(
        (p) =>
          `"${p.time}","${p.rawTime}","${currentMachine.id}","${currentMachine.name}",${p.vibration},${p.temperature},${p.current},${p.isAnomaly},"${p.anomalyLabel || "None"}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `telemetry-stream-${currentMachine.id}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Raw Data Stream & Diagnostics Lab
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
            Telemetry Pipeline & Synthetic Anomaly Injector
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Inspect raw multi-variate telemetry packets or inject synthetic faults to test live detection triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLive((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-mono font-medium transition ${
              isLive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            {isLive ? <Pause size={13} /> : <Play size={13} />}
            <span>{isLive ? "Pause Stream" : "Resume Stream"}</span>
          </button>

          <button
            onClick={exportTelemetryCSV}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-mono text-cyan-300 hover:bg-cyan-500/20 transition"
          >
            <Download size={13} />
            <span>Export CSV Buffer</span>
          </button>
        </div>
      </section>

      {/* Explorer Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab("predictor")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
            activeTab === "predictor"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <Sparkles size={14} className="text-cyan-400" />
          <span>Interactive Sensor Inputs & Predictions</span>
        </button>

        <button
          onClick={() => setActiveTab("stream")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
            activeTab === "stream"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <Database size={14} className="text-cyan-400" />
          <span>Raw Sliding Telemetry Stream ({activeBuffer.length} frames)</span>
        </button>

        <button
          onClick={() => setActiveTab("injector")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
            activeTab === "injector"
              ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-bold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <AlertTriangle size={14} className="text-red-400" />
          <span>Live Synthetic Fault Injector</span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
            activeTab === "all"
              ? "bg-zinc-800 text-white border border-zinc-700"
              : "text-zinc-500 hover:text-white border border-transparent"
          }`}
        >
          <span>View All</span>
        </button>
      </div>

      {/* 1. Manual Sensor Inputs & Real-Time Predictions */}
      {(activeTab === "predictor" || activeTab === "all") && (
        <section>
          <SensorPredictionPlayground initialMachineId={selectedMachineId} />
        </section>
      )}

      {/* 2. Live Synthetic Anomaly Injector Console */}
      {(activeTab === "injector" || activeTab === "all") && (
      <section className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/20 via-zinc-900/70 to-zinc-950 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Live Synthetic Fault Injection Console
              </h3>
              <p className="text-xs text-zinc-400">
                Trigger instantaneous telemetry anomalies during demo presentations to show real-time detection & alert dispatch.
              </p>
            </div>
          </div>

          {/* Machine Target Selector */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-400">Target Asset:</span>
            <div className="relative">
              <select
                value={targetInjectionMachine}
                onChange={(e) => setTargetInjectionMachine(e.target.value)}
                className="appearance-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 pr-8 text-xs font-mono text-zinc-200 focus:outline-none cursor-pointer"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name}
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

        {/* Injection Preset Action Buttons */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => handleInject("vibration")}
            className="group rounded-xl border border-red-500/30 bg-zinc-950/80 p-4 text-left transition hover:border-red-400 hover:bg-red-950/20 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
                <Activity size={15} /> BEARING DEFECT SPIKE
              </span>
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-mono text-red-300">
                8.6 mm/s
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Injects sudden high-frequency crest harmonic spike simulating outer-race flaking.
            </p>
            <span className="mt-3 inline-block font-mono text-xs text-red-400 group-hover:underline">
              Trigger Fault →
            </span>
          </button>

          <button
            onClick={() => handleInject("thermal")}
            className="group rounded-xl border border-amber-500/30 bg-zinc-950/80 p-4 text-left transition hover:border-amber-400 hover:bg-amber-950/20 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                <Flame size={15} /> THERMAL RUNAWAY
              </span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                89.2°C
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Injects runaway thermal gradient simulating cooling pump cavitation or blockage.
            </p>
            <span className="mt-3 inline-block font-mono text-xs text-amber-400 group-hover:underline">
              Trigger Fault →
            </span>
          </button>

          <button
            onClick={() => handleInject("current")}
            className="group rounded-xl border border-blue-500/30 bg-zinc-950/80 p-4 text-left transition hover:border-blue-400 hover:bg-blue-950/20 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400">
                <Zap size={15} /> PHASE IMBALANCE
              </span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">
                38.4 A
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Injects phase current distortion (+45% amplitude) simulating stator insulation failure.
            </p>
            <span className="mt-3 inline-block font-mono text-xs text-blue-400 group-hover:underline">
              Trigger Fault →
            </span>
          </button>
        </div>

        {showInjectedNotice && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs font-mono text-red-300 flex items-center gap-2 animate-pulse">
            <AlertTriangle size={15} />
            <span>{showInjectedNotice}. Check the Overview / Alerts page to see real-time detection!</span>
          </div>
        )}
      </section>
      )}

      {/* 3. Raw Telemetry Buffer Table */}
      {(activeTab === "stream" || activeTab === "all") && (
      <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 p-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Stream Buffer:</span>
            <div className="relative">
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="appearance-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 pr-8 text-xs font-mono text-zinc-200 focus:outline-none cursor-pointer"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>

          <span className="text-xs font-mono text-zinc-500">
            {activeBuffer.length} raw telemetry frames in active sliding window
          </span>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 border-b border-zinc-800 bg-zinc-950 text-zinc-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Epoch Ms</th>
                <th className="py-2.5 px-4">Vibration (mm/s)</th>
                <th className="py-2.5 px-4">Temp (°C)</th>
                <th className="py-2.5 px-4">Current (A)</th>
                <th className="py-2.5 px-4">Anomaly Flag</th>
                <th className="py-2.5 px-4">Diagnostic Label</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/50">
              {activeBuffer.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-zinc-800/30 ${
                    row.isAnomaly ? "bg-red-500/10 text-red-300" : "text-zinc-300"
                  }`}
                >
                  <td className="py-2.5 px-4 text-white font-medium">{row.time}</td>
                  <td className="py-2.5 px-4 text-zinc-500">{row.rawTime}</td>
                  <td className="py-2.5 px-4 font-bold">{row.vibration}</td>
                  <td className="py-2.5 px-4 font-bold">{row.temperature}</td>
                  <td className="py-2.5 px-4 font-bold">{row.current}</td>
                  <td className="py-2.5 px-4">
                    {row.isAnomaly ? (
                      <span className="rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] text-red-400 font-bold uppercase">
                        TRIGGERED
                      </span>
                    ) : (
                      <span className="text-zinc-600">NORMAL</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-amber-300">
                    {row.anomalyLabel || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
}
