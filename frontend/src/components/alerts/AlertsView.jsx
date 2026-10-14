import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Download,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "../common/StatusBadge";

export default function AlertsView() {
  const {
    alerts,
    acknowledgeAlert,
    resolveAlert,
    setSelectedAlertForModal,
    viewMachineDetails,
    machines,
  } = useTelemetry();

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [machineFilter, setMachineFilter] = useState("ALL");

  // Filtering
  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.faultType.toLowerCase().includes(search.toLowerCase()) ||
      a.machineName.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.explanation.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || a.severity.toLowerCase() === severityFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "ALL" || a.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesMachine =
      machineFilter === "ALL" || a.machineId === machineFilter;

    return matchesSearch && matchesSeverity && matchesStatus && matchesMachine;
  });

  const exportAlertsCSV = () => {
    const headers = "AlertID,MachineID,MachineName,FaultType,Severity,Status,Timestamp,ObservedValue,ExpectedRange\n";
    const rows = filteredAlerts
      .map(
        (a) =>
          `"${a.id}","${a.machineId}","${a.machineName}","${a.faultType}","${a.severity}","${a.status}","${a.timestamp}","${a.observedValue}","${a.expectedRange}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `machinasense-alerts-${Date.now()}.csv`);
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
            <ShieldAlert size={18} className="text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Diagnostic Triage Center
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
            Anomaly Alerts & Incident Investigation
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Investigate multi-sensor breaches, review root-cause hypothesis, and manage maintenance work orders.
          </p>
        </div>

        <button
          onClick={exportAlertsCSV}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-zinc-300 hover:text-white transition"
        >
          <Download size={14} />
          <span>Export Incident CSV</span>
        </button>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts by ID, keyword, or machine..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs font-mono">
          {["ALL", "Critical", "High", "Medium", "Low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`rounded px-2.5 py-1 transition ${
                severityFilter === sev
                  ? "bg-zinc-800 text-white font-bold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs font-mono">
          {["ALL", "Open", "Acknowledged", "Resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded px-2.5 py-1 transition ${
                statusFilter === st
                  ? "bg-zinc-800 text-white font-bold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Machine Selector Filter */}
        <div className="relative">
          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 pr-8 text-xs font-mono text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Machines (Fleet-wide)</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 font-mono text-xs">
            No anomaly alerts match the selected search & filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === "Critical";
            const isResolved = alert.status === "Resolved";

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-5 md:p-6 backdrop-blur-md transition-all ${
                  isResolved
                    ? "border-zinc-800/80 bg-zinc-900/30 opacity-75"
                    : isCrit
                    ? "border-red-500/30 bg-gradient-to-r from-red-950/20 via-zinc-900/60 to-zinc-950/80 hover:border-red-500/50"
                    : "border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-900/60 to-zinc-950/80 hover:border-amber-500/50"
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-cyan-400">{alert.id}</span>
                    <span className="text-zinc-600">/</span>
                    <button
                      onClick={() => viewMachineDetails(alert.machineId)}
                      className="font-bold text-white hover:text-cyan-300 transition text-sm"
                    >
                      {alert.machineName} ({alert.machineId})
                    </button>
                    <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {alert.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                      <Clock size={12} /> {alert.timestamp} ({alert.duration})
                    </span>
                    <StatusBadge status={alert.severity} size="sm" />
                    <StatusBadge status={alert.status} size="sm" />
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-2">
                    <h3 className="text-base font-bold text-amber-200">{alert.faultType}</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">{alert.explanation}</p>

                    <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Sensor Evidence:</span>
                        <span className="text-red-400 font-bold">{alert.observedValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Nominal Operating Window:</span>
                        <span className="text-emerald-400 font-semibold">{alert.expectedRange}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800/60 pt-1.5">
                        <span className="text-zinc-500">Diagnostic Model Confidence:</span>
                        <span className="text-cyan-400 font-bold">{alert.confidence}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Action Card */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        Suggested Field Action
                      </span>
                      <p className="mt-2 text-xs text-zinc-200 leading-relaxed font-sans">
                        {alert.recommendedAction}
                      </p>
                      <div className="mt-3 font-mono text-[11px] text-zinc-500">
                        Assigned: <span className="text-zinc-300">{alert.assignedTo}</span> · Work Order:{" "}
                        <span className="text-cyan-400">{alert.workOrder}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60 pt-3">
                      <button
                        onClick={() => setSelectedAlertForModal(alert)}
                        className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
                      >
                        <Eye size={13} /> Full Protocol
                      </button>

                      <div className="flex items-center gap-2">
                        {alert.status === "Open" && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-mono text-blue-300 hover:bg-blue-500/20"
                          >
                            Acknowledge
                          </button>
                        )}
                        {!isResolved ? (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-mono text-emerald-300 hover:bg-emerald-500/25 shadow-sm"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
