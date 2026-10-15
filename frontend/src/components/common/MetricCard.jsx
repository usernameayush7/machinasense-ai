import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "cyan", // cyan, emerald, amber, red, blue
  onClick,
  badgeText,
  trend,
  className = "",
}) {
  const accentStyles = {
    cyan: {
      border: "border-cyan-500/20 hover:border-cyan-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      valueColor: "text-white",
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      valueColor: "text-emerald-300",
    },
    amber: {
      border: "border-amber-500/20 hover:border-amber-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      valueColor: "text-amber-300",
    },
    red: {
      border: "border-red-500/20 hover:border-red-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
      iconBg: "bg-red-500/10 text-red-400 border-red-500/30",
      badge: "text-red-400 bg-red-500/10 border-red-500/30",
      valueColor: "text-red-400",
    },
    blue: {
      border: "border-blue-500/20 hover:border-blue-400/50",
      glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      badge: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      valueColor: "text-white",
    },
  };

  const style = accentStyles[accent] || accentStyles.cyan;

  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden rounded-xl border bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 backdrop-blur-md transition-all duration-300 ${
        style.border
      } ${style.glow} ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""} ${className}`}
    >
      {/* Subtle background glow circle */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.02] blur-xl group-hover:bg-cyan-500/5 transition-all" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${style.badge}`}
            >
              {badgeText}
            </span>
          )}
          {Icon && (
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${style.iconBg}`}
            >
              <Icon size={18} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className={`text-3xl font-extrabold tracking-tight font-mono ${style.valueColor}`}>
          {value}
        </div>
        {onClick && (
          <span className="flex items-center text-xs text-zinc-500 group-hover:text-cyan-400 transition-colors">
            Inspect <ArrowUpRight size={13} className="ml-0.5" />
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400">
        <span className="line-clamp-1">{subtitle}</span>
        {trend && (
          <span
            className={`font-mono text-[11px] font-medium ${
              trend.positive ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
