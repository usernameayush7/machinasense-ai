import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { INITIAL_MACHINES, INITIAL_ALERTS, INITIAL_ACTIVITIES, MODEL_EVALUATION } from "../data/mockData";

const TelemetryContext = createContext(null);

export const TIME_RANGES = {
  "15m": { label: "15 min", minutes: 15, points: 20, stepMs: 45000 },
  "1h": { label: "1 hour", minutes: 60, points: 25, stepMs: 144000 },
  "6h": { label: "6 hours", minutes: 360, points: 30, stepMs: 720000 },
  "24h": { label: "24 hours", minutes: 1440, points: 36, stepMs: 2400000 },
};

function generateInitialHistory(machine, timeRangeKey) {
  const range = TIME_RANGES[timeRangeKey] || TIME_RANGES["15m"];
  const points = range.points;
  const now = Date.now();
  const stepMs = (range.minutes * 60000) / points;

  const vBase = machine.sensors.vibration.baseline;
  const tBase = machine.sensors.temperature.baseline;
  const cBase = machine.sensors.current.baseline;

  const isCritical = machine.id === "PMP-002";
  const isWarning = machine.id === "MOT-003" || machine.id === "CMP-005";

  return Array.from({ length: points }, (_, index) => {
    const timestamp = new Date(now - (points - 1 - index) * stepMs);
    const progress = index / points;

    // Simulate realistic drift for problematic machines towards the end
    let vibVal = vBase + Math.sin(index * 0.7) * 0.35 + (Math.random() - 0.5) * 0.2;
    let tempVal = tBase + Math.cos(index * 0.4) * 1.5 + (Math.random() - 0.5) * 0.8;
    let currVal = cBase + Math.sin(index * 0.5) * 1.2 + (Math.random() - 0.5) * 0.5;

    let isAnomaly = false;
    let anomalyLabel = null;

    if (isCritical) {
      // Slurry pump ramp-up to failure
      if (progress > 0.6) {
        vibVal += (progress - 0.6) * 14;
        tempVal += (progress - 0.6) * 45;
        currVal += (progress - 0.6) * 15;
      }
      if (index >= points - 3) {
        isAnomaly = true;
        anomalyLabel = "Cavitation & Bearing Spike";
      }
    } else if (isWarning && machine.id === "MOT-003") {
      if (progress > 0.7) {
        currVal += (progress - 0.7) * 12;
        vibVal += (progress - 0.7) * 4;
      }
      if (index === points - 2) {
        isAnomaly = true;
        anomalyLabel = "Phase Current Imbalance";
      }
    } else if (isWarning && machine.id === "CMP-005") {
      if (progress > 0.65) {
        tempVal += (progress - 0.65) * 25;
      }
      if (index === points - 2) {
        isAnomaly = true;
        anomalyLabel = "Cooler Heat Creep";
      }
    }

    return {
      time: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      rawTime: timestamp.getTime(),
      vibration: Number(Math.max(0.1, vibVal).toFixed(2)),
      temperature: Number(Math.max(10, tempVal).toFixed(1)),
      current: Number(Math.max(0, currVal).toFixed(1)),
      isAnomaly,
      anomalyLabel
    };
  });
}

export function TelemetryProvider({ children }) {
  // Navigation State
  const [currentView, setCurrentView] = useState("overview"); // overview, machines, machine-details, alerts, analytics, explorer, settings
  const [selectedMachineId, setSelectedMachineId] = useState("PMP-002");
  const [activeFilterStatus, setActiveFilterStatus] = useState("ALL"); // ALL, Healthy, Warning, Critical
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Time Range & Simulation Controls
  const [timeRange, setTimeRange] = useState("15m");
  const [isLive, setIsLive] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(3000); // 3 seconds per tick

  // Stress Testing Parameters for Evaluation Lab
  const [stressParams, setStressParams] = useState({
    sensorNoise: 5, // %
    packetLoss: 2, // %
    operatingDrift: 0, // %
    anomalySensitivity: 85 // %
  });

  // Core Data
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Time-Series Buffers per Machine
  const [telemetryBuffers, setTelemetryBuffers] = useState(() => {
    const initial = {};
    INITIAL_MACHINES.forEach((m) => {
      initial[m.id] = generateInitialHistory(m, "15m");
    });
    return initial;
  });

  // Regenerate history when time range changes
  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
    setTelemetryBuffers((prev) => {
      const next = {};
      machines.forEach((m) => {
        next[m.id] = generateInitialHistory(m, newRange);
      });
      return next;
    });
  }, [machines]);

  // Alert Management Actions
  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "Acknowledged" } : a))
    );
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setActivities((prev) => [
        {
          id: `ACT-${Date.now()}`,
          type: "ack",
          text: `Alert ${alertId} (${alert.machineName}) acknowledged by Lead Operator.`,
          time: "Just now",
          severity: "warning",
        },
        ...prev.slice(0, 19),
      ]);
    }
  }, [alerts]);

  const resolveAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "Resolved" } : a))
    );
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      // Check if machine can recover status
      setMachines((prev) =>
        prev.map((m) => {
          if (m.id === alert.machineId) {
            return {
              ...m,
              status: "Healthy",
              healthScore: Math.min(96, m.healthScore + 25),
            };
          }
          return m;
        })
      );
      setActivities((prev) => [
        {
          id: `ACT-${Date.now()}`,
          type: "resolved",
          text: `Alert ${alertId} resolved. Equipment ${alert.machineName} reset to nominal monitoring.`,
          time: "Just now",
          severity: "healthy",
        },
        ...prev.slice(0, 19),
      ]);
    }
  }, [alerts]);

  // Inject Synthetic Anomaly for Hackathon Demonstration
  const injectSyntheticAnomaly = useCallback((type, targetMachineId = "CNC-001") => {
    const target = machines.find((m) => m.id === targetMachineId) || machines[0];
    const newAlertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    let faultType = "High-Frequency Harmonic Spike (Bearing Defect)";
    let severity = "Critical";
    let vibSpike = 8.6;
    let tempSpike = 76.5;
    let currSpike = 26.2;
    let explanation = "Injected anomaly pattern: Instantaneous crest-factor explosion exceeding 4.5 mm/s baseline threshold with 120Hz harmonics.";
    let action = "Immediate stop requested: perform vibration FFT analysis and grease bearing.";

    if (type === "thermal") {
      faultType = "Thermal Runaway / Cooling Fluid Blockage";
      severity = "Critical";
      tempSpike = 89.2;
      vibSpike = 3.8;
      currSpike = 24.5;
      explanation = "Injected anomaly pattern: Steady temperature gradient (+38°C/min) with thermal barrier breakdown in main stator cooling jacket.";
      action = "Shut down cooling circuit, inspect heat exchanger lines for particulate sludge, test flowmeter.";
    } else if (type === "current") {
      faultType = "Phase Unbalance & Stator Winding Leakage";
      severity = "High";
      currSpike = 38.4;
      vibSpike = 5.2;
      tempSpike = 72.0;
      explanation = "Injected anomaly pattern: Severe phase current distortion (+45% over nominal rating) indicating prospective inter-turn short.";
      action = "Trip feeder breaker, perform 1000V Megger insulation resistance test across phases.";
    }

    // Update machine readings
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id === target.id) {
          return {
            ...m,
            status: severity === "Critical" ? "Critical" : "Warning",
            healthScore: Math.max(35, m.healthScore - 30),
            sensors: {
              ...m.sensors,
              vibration: { ...m.sensors.vibration, value: vibSpike, status: vibSpike > m.sensors.vibration.threshold ? "critical" : "normal" },
              temperature: { ...m.sensors.temperature, value: tempSpike, status: tempSpike > m.sensors.temperature.threshold ? "critical" : "normal" },
              current: { ...m.sensors.current, value: currSpike, status: currSpike > m.sensors.current.threshold ? "warning" : "normal" },
            }
          };
        }
        return m;
      })
    );

    // Push into time-series buffer
    setTelemetryBuffers((prev) => {
      const buffer = prev[target.id] || [];
      const newPoint = {
        time: nowStr,
        rawTime: Date.now(),
        vibration: vibSpike,
        temperature: tempSpike,
        current: currSpike,
        isAnomaly: true,
        anomalyLabel: faultType,
      };
      return {
        ...prev,
        [target.id]: [...buffer.slice(1), newPoint],
      };
    });

    // Add alert
    const newAlert = {
      id: newAlertId,
      machineId: target.id,
      machineName: target.name,
      faultType,
      category: "Injected Diagnostic Test",
      severity,
      status: "Open",
      confidence: "97.4% (Live Injected Inference)",
      timestamp: nowStr,
      duration: "Just now",
      sensorEvidence: `Vib: ${vibSpike} mm/s · Temp: ${tempSpike}°C · Current: ${currSpike} A`,
      observedValue: `${vibSpike} mm/s & ${tempSpike}°C`,
      expectedRange: `Vib < ${target.sensors.vibration.threshold} mm/s, Temp < ${target.sensors.temperature.threshold}°C`,
      explanation,
      recommendedAction: action,
      assignedTo: "On-Duty Shift Engineer",
      workOrder: `WO-LIVE-${Math.floor(100 + Math.random() * 900)}`,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Add activity
    setActivities((prev) => [
      {
        id: `ACT-${Date.now()}`,
        type: "anomaly",
        text: `Synthetic fault injected: ${faultType} on ${target.name} (${target.id}).`,
        time: "Just now",
        severity: severity === "Critical" ? "critical" : "warning",
      },
      ...prev.slice(0, 19),
    ]);
  }, [machines]);

  // Live Telemetry Loop (updates only if isLive is true)
  useEffect(() => {
    if (!isLive) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      setLastUpdated(now);
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      setTelemetryBuffers((prev) => {
        const nextBuffers = { ...prev };

        machines.forEach((machine) => {
          const currentBuffer = prev[machine.id] || [];
          const vSensor = machine.sensors.vibration;
          const tSensor = machine.sensors.temperature;
          const cSensor = machine.sensors.current;

          // Add simulated noise based on stress test parameters
          const noiseFactor = (stressParams.sensorNoise / 100) * 1.5;
          const noise = (Math.random() - 0.5) * noiseFactor;

          // Natural fluctuation
          const vNoise = (Math.random() - 0.5) * 0.2 + noise * vSensor.baseline;
          const tNoise = (Math.random() - 0.5) * 0.4 + noise * tSensor.baseline;
          const cNoise = (Math.random() - 0.5) * 0.3 + noise * cSensor.baseline;

          let newV = Number(Math.max(0.1, vSensor.value + vNoise).toFixed(2));
          let newT = Number(Math.max(15, tSensor.value + tNoise).toFixed(1));
          let newC = Number(Math.max(1, cSensor.value + cNoise).toFixed(1));

          // Critical or Warning drift
          if (machine.id === "PMP-002" && machine.status === "Critical") {
            newV = Number((8.4 + Math.random() * 0.9).toFixed(2));
            newT = Number((83.5 + Math.random() * 2.0).toFixed(1));
            newC = Number((30.8 + Math.random() * 1.5).toFixed(1));
          } else if (machine.id === "MOT-003" && machine.status === "Warning") {
            newV = Number((4.6 + Math.random() * 0.4).toFixed(2));
            newC = Number((27.2 + Math.random() * 0.9).toFixed(1));
          } else if (machine.id === "CMP-005" && machine.status === "Warning") {
            newT = Number((76.5 + Math.random() * 1.8).toFixed(1));
          }

          // Handle packet loss simulation: skip point if packet dropped
          const packetDropped = Math.random() < (stressParams.packetLoss / 100);
          if (packetDropped && currentBuffer.length > 5) {
            return;
          }

          const newPoint = {
            time: timeStr,
            rawTime: Date.now(),
            vibration: newV,
            temperature: newT,
            current: newC,
            isAnomaly: newV > vSensor.threshold || newT > tSensor.threshold,
            anomalyLabel: newV > vSensor.threshold ? "Threshold Breach" : null,
          };

          const maxPoints = TIME_RANGES[timeRange]?.points || 25;
          nextBuffers[machine.id] = [...currentBuffer.slice(1), newPoint];
        });

        return nextBuffers;
      });

      // Update machine live sensor values in state
      setMachines((prev) =>
        prev.map((machine) => {
          const buffer = telemetryBuffers[machine.id];
          if (!buffer || buffer.length === 0) return machine;
          const latest = buffer[buffer.length - 1];
          if (!latest) return machine;

          return {
            ...machine,
            sensors: {
              ...machine.sensors,
              vibration: {
                ...machine.sensors.vibration,
                value: latest.vibration,
                status: latest.vibration > machine.sensors.vibration.threshold ? "critical" : latest.vibration > machine.sensors.vibration.threshold * 0.85 ? "warning" : "normal"
              },
              temperature: {
                ...machine.sensors.temperature,
                value: latest.temperature,
                status: latest.temperature > machine.sensors.temperature.threshold ? "critical" : latest.temperature > machine.sensors.temperature.threshold * 0.9 ? "warning" : "normal"
              },
              current: {
                ...machine.sensors.current,
                value: latest.current,
                status: latest.current > machine.sensors.current.threshold ? "warning" : "normal"
              }
            }
          };
        })
      );
    }, simulationSpeed);

    return () => clearInterval(intervalId);
  }, [isLive, simulationSpeed, machines, timeRange, stressParams, telemetryBuffers]);

  // Navigate to machine details
  const viewMachineDetails = useCallback((machineId) => {
    setSelectedMachineId(machineId);
    setCurrentView("machine-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Filter machines from KPI clicks
  const filterMachinesByStatus = useCallback((status) => {
    setActiveFilterStatus(status);
    setCurrentView("machines");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Navigate to filtered alerts
  const viewAlertsWithFilter = useCallback((severity) => {
    setCurrentView("alerts");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Computed Values
  const totalMachines = machines.length;
  const healthyMachines = machines.filter((m) => m.status === "Healthy").length;
  const warningMachines = machines.filter((m) => m.status === "Warning").length;
  const criticalMachines = machines.filter((m) => m.status === "Critical").length;
  const activeAnomalies = alerts.filter((a) => a.status === "Open" || a.status === "Acknowledged").length;
  const criticalAlerts = alerts.filter((a) => a.severity === "Critical" && a.status !== "Resolved").length;
  const avgHealthScore = Math.round(
    machines.reduce((acc, m) => acc + m.healthScore, 0) / totalMachines
  );

  return (
    <TelemetryContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedMachineId,
        setSelectedMachineId,
        activeFilterStatus,
        setActiveFilterStatus,
        searchQuery,
        setSearchQuery,
        selectedAlertForModal,
        setSelectedAlertForModal,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        timeRange,
        setTimeRange: handleTimeRangeChange,
        isLive,
        setIsLive,
        simulationSpeed,
        setSimulationSpeed,
        stressParams,
        setStressParams,
        machines,
        alerts,
        activities,
        lastUpdated,
        telemetryBuffers,
        acknowledgeAlert,
        resolveAlert,
        injectSyntheticAnomaly,
        viewMachineDetails,
        filterMachinesByStatus,
        viewAlertsWithFilter,
        totalMachines,
        healthyMachines,
        warningMachines,
        criticalMachines,
        activeAnomalies,
        criticalAlerts,
        avgHealthScore,
        modelEvaluation: MODEL_EVALUATION
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
}
