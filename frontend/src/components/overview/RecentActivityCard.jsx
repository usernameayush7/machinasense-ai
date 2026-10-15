import React from "react";
import { Activity, Bell, CheckCircle2, AlertTriangle, Cpu, Radio } from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";

export default function RecentActivityCard() {
  const { activities } = useTelemetry();

  const getIcon = (type, severity) => {
    switch (type) {
      case "anomaly":
        return <AlertTriangle size={14} className="text-red-400" />;
      case "ack":
        return <Bell size={14} className="text-amber-400" />;
      case "resolved":
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "evaluation":
        return <Activity size={14} className="text-cyan-400" />;
      default:
        return <Radio size={14} className="text-blue-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 md:p-6 backdrop-blur-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Audit Stream
            </h3>
          </div>
          <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
            DEMO EVENTS
          </span>
        </div>

        <div className="mt-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {activities.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                {getIcon(item.type, item.severity)}
              </div>
              <div className="flex-1">
                <p className="text-zinc-200 leading-snug">{item.text}</p>
                <span className="text-[10px] font-mono text-zinc-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-800/80 pt-3 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
        <span>Deterministic Demo Log</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active Polling
        </span>
      </div>
    </div>
  );
}
