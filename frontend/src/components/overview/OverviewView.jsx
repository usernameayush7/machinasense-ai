import React from "react";
import {
  Factory,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Activity,
  RotateCw,
  Database,
  Radio,
  Sparkles,
} from "lucide-react";
import { useTelemetry, TIME_RANGES } from "../../context/TelemetryContext";
import MetricCard from "../common/MetricCard";
import LiveSensorCharts from "./LiveSensorCharts";
import FleetHealthTable from "./FleetHealthTable";
import RecentAlertsCard from "./RecentAlertsCard";
import ConditionDistributionChart from "./ConditionDistributionChart";
import RecentActivityCard from "./RecentActivityCard";

export default function OverviewView() {
  const {
    totalMachines,
    healthyMachines,
    activeAnomalies,
    criticalAlerts,
    avgHealthScore,
    filterMachinesByStatus,
    viewAlertsWithFilter,
    setCurrentView,
    timeRange,
    setTimeRange,
    isLive,
    setIsLive,
  } = useTelemetry();

  const handleRefresh = () => {
    // Triggers timeRange refresh re-computation
    setTimeRange(timeRange);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
              </span>
              LIVE DEMO
            </span>
            <span className="text-xs font-mono text-zinc-500">Facility: Plant Alpha-01</span>
          </div>

          <h2 className="mt-2.5 text-2xl md:text-3xl font-black tracking-tight text-white font-mono">
            Industrial Intelligence Center
          </h2>

          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Monitor equipment health, investigate anomalies, and prevent unexpected downtime.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time range selector */}
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {Object.keys(TIME_RANGES).map((rangeKey) => (
              <button
                key={rangeKey}
                onClick={() => setTimeRange(rangeKey)}
                className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                  timeRange === rangeKey
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {TIME_RANGES[rangeKey].label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            title="Refresh telemetry frame"
          >
            <RotateCw size={13} className="text-zinc-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Data Explorer Shortcut */}
          <button
            onClick={() => setCurrentView("explorer")}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-500/20 transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <Database size={13} />
            <span>Data Explorer</span>
          </button>
        </div>
      </section>

      {/* 5 KPI Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Machines Monitored"
          value={totalMachines}
          subtitle="Across 3 production bays"
          icon={Factory}
          accent="blue"
          badgeText="Active Fleet"
          onClick={() => filterMachinesByStatus("ALL")}
        />

        <MetricCard
          title="Healthy Machines"
          value={healthyMachines}
          subtitle={`${Math.round((healthyMachines / totalMachines) * 100)}% nominal operating rate`}
          icon={CheckCircle}
          accent="emerald"
          badgeText="Stable"
          onClick={() => filterMachinesByStatus("Healthy")}
        />

        <MetricCard
          title="Active Anomalies"
          value={activeAnomalies}
          subtitle="Requires technician triage"
          icon={AlertTriangle}
          accent="amber"
          badgeText="Review"
          onClick={() => viewAlertsWithFilter("High")}
        />

        <MetricCard
          title="Critical Alerts"
          value={criticalAlerts}
          subtitle="Highest inspection priority"
          icon={ShieldAlert}
          accent="red"
          badgeText="Urgent"
          onClick={() => viewAlertsWithFilter("Critical")}
        />

        <MetricCard
          title="Avg Machine Health"
          value={`${avgHealthScore}%`}
          subtitle="Fleet-wide aggregate score"
          icon={Activity}
          accent="cyan"
          badgeText="Score"
          onClick={() => setCurrentView("machines")}
        />
      </section>

      {/* Live Sensor Time-Series Chart */}
      <section>
        <LiveSensorCharts showMachineSelector={true} />
      </section>

      {/* Machine Fleet Health Matrix */}
      <section>
        <FleetHealthTable />
      </section>

      {/* 3-Column Bottom Analytics: Alerts + Distribution + Activity */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecentAlertsCard limit={3} />
        </div>

        <div className="lg:col-span-1">
          <ConditionDistributionChart />
        </div>

        <div className="lg:col-span-1">
          <RecentActivityCard />
        </div>
      </section>
    </div>
  );
}
