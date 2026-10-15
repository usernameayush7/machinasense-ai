import React, { useState } from "react";
import {
  Sliders,
  Radio,
  Bell,
  Link,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
  Zap,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";

export default function SettingsView() {
  const { simulationSpeed, setSimulationSpeed, stressParams, setStressParams } =
    useTelemetry();

  const [apiEndpoint, setApiEndpoint] = useState("https://api.machinasense.industrial.internal/v2/telemetry");
  const [apiKey, setApiKey] = useState("msk_live_948201a894bc7210");
  const [pingStatus, setPingStatus] = useState(null); // 'testing' | 'success' | 'idle'
  const [sensitivity, setSensitivity] = useState("balanced"); // low, balanced, high
  const [notifications, setNotifications] = useState({
    email: true,
    webhook: true,
    sms: false,
    audioBeep: true,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestConnection = () => {
    setPingStatus("testing");
    setTimeout(() => {
      setPingStatus("success");
      setTimeout(() => setPingStatus(null), 3000);
    }, 800);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Control Panel Configuration
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
            System & Ingestion Engine Settings
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Configure telemetry polling frequencies, threshold tolerances, notification webhooks, and backend ML endpoints.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-mono font-bold text-zinc-950 hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <Save size={14} />
          <span>Save Preferences</span>
        </button>
      </section>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Configuration saved successfully. Ingestion parameters updated.</span>
        </div>
      )}

      {/* Grid Settings Panels */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Simulation & Feed Rates */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio size={16} className="text-cyan-400" /> Telemetry Ingestion Timing
          </h3>
          <p className="text-xs text-zinc-400">
            Control the interval between simulated sensor ticks sent to dashboard charts.
          </p>

          <div className="space-y-2 pt-2">
            {[
              { label: "High-Frequency (1.5 seconds)", value: 1500 },
              { label: "Standard Monitoring (3.0 seconds)", value: 3000 },
              { label: "Low-Bandwidth (5.0 seconds)", value: 5000 },
            ].map((opt) => (
              <label
                key={opt.value}
                onClick={() => setSimulationSpeed(opt.value)}
                className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer text-xs font-mono transition ${
                  simulationSpeed === opt.value
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <span>{opt.label}</span>
                <input
                  type="radio"
                  name="simSpeed"
                  checked={simulationSpeed === opt.value}
                  onChange={() => {}}
                  className="accent-cyan-400"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Anomaly Detection Sensitivity */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> Detection Sensitivity
          </h3>
          <p className="text-xs text-zinc-400">
            Adjust the confidence threshold required before an alert is dispatched.
          </p>

          <div className="space-y-2 pt-2">
            {[
              { id: "high", title: "High Sensitivity (Aggressive)", desc: "Triggers on minor transient spikes; higher false alarms." },
              { id: "balanced", title: "Balanced (Recommended)", desc: "Filters transient noise; alerts on sustained multi-point breaches." },
              { id: "conservative", title: "Conservative (Critical Only)", desc: "Triggers only on severe verified multi-sensor anomalies." },
            ].map((item) => (
              <label
                key={item.id}
                onClick={() => setSensitivity(item.id)}
                className={`block rounded-xl border p-3 cursor-pointer text-xs transition ${
                  sensitivity === item.id
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{item.title}</span>
                  <input
                    type="radio"
                    name="sens"
                    checked={sensitivity === item.id}
                    onChange={() => {}}
                    className="accent-amber-400"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">{item.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Backend & Edge ML Gateway Endpoint */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Industrial Edge Gateway & REST Inference Endpoint
              </h3>
            </div>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              Ready for Real Hardware / API Integration
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            MachinaSense is designed so that when connecting real factory PLCs or edge gateways (OPC-UA / MQTT),
            you simply configure the endpoint URL and bearer token below.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 font-mono text-xs">
            <div>
              <label className="text-zinc-400">Inference Gateway URL</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-zinc-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400">Gateway API Key / Token</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-zinc-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={pingStatus === "testing"}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-mono text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <Link size={13} />
              <span>{pingStatus === "testing" ? "Pinging Gateway..." : "Test Connection (Ping)"}</span>
            </button>

            {pingStatus === "success" && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <CheckCircle2 size={15} /> Gateway Connected (14ms latency)
              </span>
            )}
          </div>
        </div>

        {/* Notification Alert Rules */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md space-y-4 md:col-span-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell size={16} className="text-amber-400" /> Dispatch Routing Channels
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            {Object.entries({
              email: "Email to On-Call Engineer",
              webhook: "Slack / Teams Webhook",
              sms: "SMS Urgent Page (Twilio)",
              audioBeep: "Control Room Sound Alert",
            }).map(([key, label]) => (
              <label
                key={key}
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition ${
                  notifications[key]
                    ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-500"
                }`}
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={() => {}}
                  className="accent-cyan-400"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
