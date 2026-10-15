import React from "react";

export default function StatusBadge({ status, size = "md" }) {
  const normalized = status?.toLowerCase() || "healthy";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  const statusConfigs = {
    healthy: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
      label: "Healthy",
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]",
      label: "Warning",
    },
    critical: {
      bg: "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse",
      dot: "bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.9)]",
      label: "Critical",
    },
    open: {
      bg: "bg-red-500/10 border-red-500/30 text-red-400",
      dot: "bg-red-400",
      label: "Open",
    },
    acknowledged: {
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      dot: "bg-blue-400",
      label: "Acknowledged",
    },
    resolved: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      dot: "bg-emerald-400",
      label: "Resolved",
    },
  };

  const config = statusConfigs[normalized] || statusConfigs.healthy;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider ${config.bg} ${sizeStyles[size]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
