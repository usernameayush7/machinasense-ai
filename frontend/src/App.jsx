import React, { useState } from "react";
import { TelemetryProvider, useTelemetry } from "./context/TelemetryContext";
import Sidebar from "./components/layout/Sidebar";
import TopNavbar from "./components/layout/TopNavbar";
import NotificationDrawer from "./components/layout/NotificationDrawer";
import AlertModal from "./components/alerts/AlertModal";

// Views
import OverviewView from "./components/overview/OverviewView";
import MachinesView from "./components/machines/MachinesView";
import MachineDetailsView from "./components/machineDetails/MachineDetailsView";
import AlertsView from "./components/alerts/AlertsView";
import AnalyticsView from "./components/analytics/AnalyticsView";
import DataExplorerView from "./components/explorer/DataExplorerView";
import SettingsView from "./components/settings/SettingsView";

function DashboardContent() {
  const { currentView } = useTelemetry();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case "overview":
        return <OverviewView />;
      case "machines":
        return <MachinesView />;
      case "machine-details":
        return <MachineDetailsView />;
      case "alerts":
        return <AlertsView />;
      case "analytics":
        return <AnalyticsView />;
      case "explorer":
        return <DataExplorerView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Layout Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderView()}
        </main>

        {/* Industrial Footer */}
        <footer className="border-t border-zinc-800/80 bg-zinc-950/80 px-6 py-5 text-center text-xs font-mono text-zinc-500">
          <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>MachinaSense · PS 01 Hackathon Edition</span>
            </div>
            <div className="text-zinc-600">
              High-Frequency Simulated Telemetry Engine · Ready for Edge Inference Integration
            </div>
            <div className="text-zinc-500">
              Plant ID: <strong className="text-zinc-400">PLANT-ALPHA-01</strong>
            </div>
          </div>
        </footer>
      </div>

      {/* Drawers & Modals */}
      <NotificationDrawer />
      <AlertModal />
    </div>
  );
}

export default function App() {
  return (
    <TelemetryProvider>
      <DashboardContent />
    </TelemetryProvider>
  );
}
