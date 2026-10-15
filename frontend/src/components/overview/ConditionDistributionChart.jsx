import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTelemetry } from "../../context/TelemetryContext";
import { PieChart as PieIcon } from "lucide-react";

export default function ConditionDistributionChart() {
  const { healthyMachines, warningMachines, criticalMachines, totalMachines, filterMachinesByStatus } =
    useTelemetry();

  const data = [
    { name: "Healthy", value: healthyMachines, color: "#10b981", bg: "bg-emerald-500/10 text-emerald-400" },
    { name: "Warning", value: warningMachines, color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400" },
    { name: "Critical", value: criticalMachines, color: "#ef4444", bg: "bg-red-500/10 text-red-400" },
  ];

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const pct = Math.round((item.value / totalMachines) * 100);

    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 font-mono text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
          <span className="text-white font-bold">{item.name}:</span>
          <span className="text-zinc-300">{item.value} machines ({pct}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 md:p-6 backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <PieIcon size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Condition Distribution
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">{totalMachines} Total Assets</span>
      </div>

      <div className="relative my-2 h-48 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black font-mono text-white">
            {Math.round((healthyMachines / totalMachines) * 100)}%
          </span>
          <span className="text-[10px] font-mono text-zinc-400 uppercase">Operational</span>
        </div>
      </div>

      {/* Legend & Filter Shortcuts */}
      <div className="space-y-2 border-t border-zinc-800/80 pt-3">
        {data.map((item) => (
          <button
            key={item.name}
            onClick={() => filterMachinesByStatus(item.name)}
            className="flex w-full items-center justify-between rounded-lg p-1.5 hover:bg-zinc-800/60 transition group text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-zinc-300 group-hover:text-white">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{item.value}</span>
              <span className="text-[10px] text-zinc-500">
                ({Math.round((item.value / totalMachines) * 100)}%)
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
