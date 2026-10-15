import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Activity,
  Thermometer,
  Zap,
  Gauge,
  Sliders,
  Send,
  Clock,
  Wrench,
  Radio,
  Brain,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import StatusBadge from "./StatusBadge";

export default function SensorPredictionPlayground({
  initialMachineId = null,
}) {
  const {
    machines,
    injectSyntheticAnomaly,
  } = useTelemetry();

  // Selected machine context
  const [selectedMachineId, setSelectedMachineId] = useState(
    initialMachineId || "PMP-002"
  );

  const activeMachine =
    machines.find((m) => m.id === selectedMachineId) || machines[0];

  // Existing dashboard sensor inputs
  const [vibration, setVibration] = useState(
    activeMachine.sensors.vibration.value
  );
  const [temperature, setTemperature] = useState(
    activeMachine.sensors.temperature.value
  );
  const [current, setCurrent] = useState(
    activeMachine.sensors.current.value
  );
  const [rpm, setRpm] = useState(
    activeMachine.sensors.rpm?.value || 1750
  );
  const [pressure, setPressure] = useState(
    activeMachine.sensors.pressure?.value || 4.2
  );
  const [acoustic, setAcoustic] = useState(38);

  // Separate inputs for the trained ML model.
  // These are not inferred from unrelated dashboard sensors.
  const [airTemperature, setAirTemperature] = useState(300);
  const [processTemperature, setProcessTemperature] = useState(310);
  const [mlRpm, setMlRpm] = useState(1500);
  const [torque, setTorque] = useState(40);
  const [toolWear, setToolWear] = useState(100);

  // Backend prediction state
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState("");

  // Existing alert feedback
  const [dispatchedNotice, setDispatchedNotice] = useState(null);

  // Call the FastAPI backend, which forwards the request to the ML API.
  const runMLPrediction = async () => {
    setMlLoading(true);
    setMlError("");
    setMlPrediction(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/ml/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            air_temperature: Number(airTemperature),
            process_temperature: Number(processTemperature),
            rotational_speed: Number(mlRpm),
            torque: Number(torque),
            tool_wear: Number(toolWear),
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Backend returned HTTP ${response.status}: ${errorBody}`
        );
      }

      const data = await response.json();
      setMlPrediction(data);
    } catch (error) {
      setMlError(
        error.message ||
          "Unable to get a prediction. Check that both backend services are running."
      );
    } finally {
      setMlLoading(false);
    }
  };

  // Quick preset handlers for the existing simulator
  const applyPreset = (presetName) => {
    if (presetName === "healthy") {
      setVibration(activeMachine.sensors.vibration.baseline);
      setTemperature(activeMachine.sensors.temperature.baseline);
      setCurrent(activeMachine.sensors.current.baseline);
      setRpm(activeMachine.sensors.rpm?.baseline || 1750);
      setPressure(activeMachine.sensors.pressure?.baseline || 4.5);
      setAcoustic(24);
    } else if (presetName === "bearing") {
      setVibration(8.8);
      setTemperature(82.5);
      setCurrent(28.4);
      setRpm(activeMachine.sensors.rpm?.baseline || 1740);
      setPressure(4.0);
      setAcoustic(78);
    } else if (presetName === "thermal") {
      setVibration(3.4);
      setTemperature(91.2);
      setCurrent(26.0);
      setRpm(1730);
      setPressure(3.8);
      setAcoustic(45);
    } else if (presetName === "current") {
      setVibration(5.2);
      setTemperature(74.0);
      setCurrent(39.8);
      setRpm(1690);
      setPressure(4.1);
      setAcoustic(58);
    } else if (presetName === "cavitation") {
      setVibration(7.6);
      setTemperature(69.0);
      setCurrent(32.5);
      setRpm(1760);
      setPressure(2.1);
      setAcoustic(84);
    }
  };

  // Switch active machine and load its defaults
  const handleMachineChange = (id) => {
    setSelectedMachineId(id);

    const machine = machines.find((item) => item.id === id);

    if (machine) {
      setVibration(machine.sensors.vibration.value);
      setTemperature(machine.sensors.temperature.value);
      setCurrent(machine.sensors.current.value);
      setRpm(machine.sensors.rpm?.value || 1750);
      setPressure(machine.sensors.pressure?.value || 4.5);
    }
  };

  // Existing simulated diagnostic logic.
  // This is separate from the trained backend ML model.
  const prediction = useMemo(() => {
    const vThresh = activeMachine.sensors.vibration.threshold;
    const tThresh = activeMachine.sensors.temperature.threshold;
    const cThresh = activeMachine.sensors.current.threshold;

    const vRatio = vibration / vThresh;
    const tRatio = temperature / tThresh;
    const cRatio = current / cThresh;

    const pRatio = activeMachine.sensors.pressure
      ? pressure / activeMachine.sensors.pressure.threshold
      : 1;

    const vImpact = Math.max(0, (vRatio - 0.7) * 45);
    const tImpact = Math.max(0, (tRatio - 0.75) * 35);
    const cImpact = Math.max(0, (cRatio - 0.8) * 30);
    const aImpact = Math.max(0, (acoustic - 35) * 0.4);
    const totalImpact = vImpact + tImpact + cImpact + aImpact || 1;

    const shapVib = Math.round((vImpact / totalImpact) * 100);
    const shapTemp = Math.round((tImpact / totalImpact) * 100);
    const shapCurr = Math.round((cImpact / totalImpact) * 100);
    const shapOther = Math.max(
      0,
      100 - (shapVib + shapTemp + shapCurr)
    );

    let riskScore =
      (vRatio * 0.45 + tRatio * 0.35 + cRatio * 0.2) * 60;

    if (vRatio > 1.3 || tRatio > 1.15) {
      riskScore = Math.max(riskScore, 85);
    }

    if (vRatio > 1.6 || tRatio > 1.3) {
      riskScore = Math.max(riskScore, 95);
    }

    riskScore = Math.min(
      99.4,
      Math.max(4.2, Number(riskScore.toFixed(1)))
    );

    const healthScore = Math.max(
      10,
      Math.min(98, Math.round(100 - riskScore))
    );

    let status = "Healthy";
    let failureMode = "Nominal Operational Envelope (No Faults Detected)";
    let confidence = "98.2%";
    let rulHours = "> 1,200 hrs (Stable)";
    let action =
      "No corrective action required. Maintain standard lubrication cadence.";
    let severity = "Low";

    if (riskScore >= 75) {
      status = "Critical";
      severity = "Critical";
      rulHours = "< 24 operating hours";

      if (vRatio >= 1.4 && tRatio >= 1.1) {
        failureMode =
          "Stage 3 Bearing Race Pitting & Spindle Hydrodynamic Collapse";
        confidence = "95.6% (High Confidence)";
        action =
          "Stop and assess the equipment according to site safety procedures. Have qualified personnel inspect bearing clearance and the drive-end bearing.";
      } else if (vRatio >= 1.4) {
        failureMode =
          "Mechanical Imbalance & Severe Shaft Eccentricity";
        confidence = "93.4% (High Confidence)";
        action =
          "Have qualified maintenance personnel check coupling alignment and dynamic balance.";
      } else if (tRatio >= 1.15) {
        failureMode =
          "Thermal Runaway & Stator Cooling Circuit Failure";
        confidence = "94.8% (High Confidence)";
        action =
          "Have qualified personnel inspect cooling flow, heat exchanger condition, and the thermal bypass valve.";
      } else {
        failureMode =
          "Severe Multi-Parameter Operational Breakdown";
        confidence = "91.2%";
        action =
          "Follow the site's safety procedures and arrange a full electrical and mechanical diagnostic assessment.";
      }
    } else if (riskScore >= 45) {
      status = "Warning";
      severity = "High";
      rulHours = "72 - 160 operating hours";

      if (cRatio >= 1.1) {
        failureMode =
          "Phase Current Distortion & Possible Stator Winding Issue";
        confidence = "89.1%";
        action =
          "Arrange an electrical insulation test and inspect the drive system during planned maintenance.";
      } else if (vRatio >= 1.05) {
        failureMode = "Possible Bearing Cage Wear";
        confidence = "86.5%";
        action =
          "Inspect lubrication, review the vibration signature, and monitor bearing condition.";
      } else if (tRatio >= 1.0) {
        failureMode = "Elevated Operating Temperature";
        confidence = "84.2%";
        action =
          "Inspect cooling ventilation filters and verify cooling system operation.";
      } else {
        failureMode = "Sub-Optimal Operating Parameter Deviation";
        confidence = "82.0%";
        action =
          "Verify operating conditions, review maintenance schedules, and monitor subsequent readings.";
      }
    }

    return {
      status,
      severity,
      riskScore,
      healthScore,
      failureMode,
      confidence,
      rulHours,
      action,
      shap: {
        vibration: shapVib,
        temperature: shapTemp,
        current: shapCurr,
        other: shapOther,
      },
    };
  }, [
    vibration,
    temperature,
    current,
    rpm,
    pressure,
    acoustic,
    activeMachine,
  ]);

  // Dispatch into the existing system alert queue
  const handleDispatchAlert = () => {
    let type = "vibration";

    if (temperature > activeMachine.sensors.temperature.threshold) {
      type = "thermal";
    }

    if (current > activeMachine.sensors.current.threshold) {
      type = "current";
    }

    injectSyntheticAnomaly(type, selectedMachineId);

    setDispatchedNotice(
      `Created and dispatched alert to active queue for ${activeMachine.id}`
    );

    setTimeout(() => setDispatchedNotice(null), 4000);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-300">
              <Sparkles size={13} className="text-cyan-400" />
              INTERACTIVE INFERENCE LAB
            </span>

            <span className="text-xs font-mono text-zinc-400">
              What-If Diagnostic Simulator
            </span>
          </div>

          <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
            Manual Sensor Input & Real-Time Predictive Inference
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            Explore simulated dashboard diagnostics and run the trained ML
            model through the backend API.
          </p>
        </div>

        {/* Machine Target Selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-400">Target Machine:</span>

          <select
            value={selectedMachineId}
            onChange={(e) => handleMachineChange(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-zinc-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.id} — {machine.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Fault Presets */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
          <Sliders size={13} className="text-cyan-400" />
          Quick Load Diagnostic Scenarios:
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset("healthy")}
            className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-xs font-mono text-emerald-300 hover:bg-emerald-950/40 transition"
          >
            🟢 Nominal Baseline
          </button>

          <button
            onClick={() => applyPreset("bearing")}
            className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-mono text-red-300 hover:bg-red-950/40 transition"
          >
            🔴 Bearing Pitting (8.8 mm/s)
          </button>

          <button
            onClick={() => applyPreset("thermal")}
            className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs font-mono text-amber-300 hover:bg-amber-950/40 transition"
          >
            🟠 Thermal Runaway (91.2°C)
          </button>

          <button
            onClick={() => applyPreset("current")}
            className="rounded-lg border border-blue-500/30 bg-blue-950/20 px-3 py-1.5 text-xs font-mono text-blue-300 hover:bg-blue-950/40 transition"
          >
            🔵 Phase Unbalance (39.8 A)
          </button>

          <button
            onClick={() => applyPreset("cavitation")}
            className="rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-1.5 text-xs font-mono text-purple-300 hover:bg-purple-950/40 transition"
          >
            🟣 Fluid Cavitation (Low bar + Vib)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Existing Dashboard Sensors */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Radio size={15} className="text-cyan-400" />
              Sensor Input Matrix
            </h3>

            <span className="text-[11px] font-mono text-zinc-500">
              Dashboard Simulator
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Vibration */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-sans font-medium flex items-center gap-1.5">
                  <Activity size={14} className="text-cyan-400" />
                  Vibration Velocity (mm/s)
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">
                    Threshold: {activeMachine.sensors.vibration.threshold}
                  </span>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={vibration}
                    onChange={(e) => setVibration(Number(e.target.value))}
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right font-bold text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <input
                type="range"
                min="0.5"
                max="15"
                step="0.1"
                value={vibration}
                onChange={(e) => setVibration(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Casing Temperature */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-sans font-medium flex items-center gap-1.5">
                  <Thermometer size={14} className="text-amber-400" />
                  Casing Temperature (°C)
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">
                    Threshold: {activeMachine.sensors.temperature.threshold}°C
                  </span>

                  <input
                    type="number"
                    step="0.5"
                    min="20"
                    max="140"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <input
                type="range"
                min="25"
                max="120"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Motor Current */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-sans font-medium flex items-center gap-1.5">
                  <Zap size={14} className="text-sky-400" />
                  Motor Phase Current (A)
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">
                    Threshold: {activeMachine.sensors.current.threshold} A
                  </span>

                  <input
                    type="number"
                    step="0.2"
                    min="0"
                    max="80"
                    value={current}
                    onChange={(e) => setCurrent(Number(e.target.value))}
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right font-bold text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="60"
                step="0.2"
                value={current}
                onChange={(e) => setCurrent(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* RPM and Pressure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-sans text-xs flex items-center gap-1">
                    <Gauge size={13} className="text-purple-400" />
                    Rotational Speed (RPM)
                  </span>

                  <input
                    type="number"
                    step="50"
                    min="500"
                    max="15000"
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-right font-bold text-white text-xs"
                  />
                </div>

                <input
                  type="range"
                  min="500"
                  max="14000"
                  step="50"
                  value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-sans text-xs flex items-center gap-1">
                    <Clock size={13} className="text-emerald-400" />
                    System Pressure (bar)
                  </span>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="250"
                    value={pressure}
                    onChange={(e) => setPressure(Number(e.target.value))}
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-right font-bold text-white text-xs"
                  />
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.1"
                  value={pressure}
                  onChange={(e) => setPressure(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Predictions */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 space-y-4 flex flex-col justify-between">
          <div>
            {/* Existing simulated prediction */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-400" />
                Dashboard Simulation
              </h3>

              <StatusBadge status={prediction.status} size="sm" />
            </div>

            {/* Health and Risk Gauges */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-center font-mono">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                <span className="text-[10px] text-zinc-400 uppercase">
                  Health Score
                </span>

                <p
                  className={`mt-1 text-3xl font-black ${
                    prediction.healthScore > 80
                      ? "text-emerald-400"
                      : prediction.healthScore > 50
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {prediction.healthScore}%
                </p>

                <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      prediction.healthScore > 80
                        ? "bg-emerald-400"
                        : prediction.healthScore > 50
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${prediction.healthScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                <span className="text-[10px] text-zinc-400 uppercase">
                  Simulated Risk Score
                </span>

                <p
                  className={`mt-1 text-3xl font-black ${
                    prediction.riskScore > 70
                      ? "text-red-400"
                      : prediction.riskScore > 40
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {prediction.riskScore}%
                </p>

                <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      prediction.riskScore > 70
                        ? "bg-red-400"
                        : prediction.riskScore > 40
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${prediction.riskScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Simulated Failure Mode */}
            <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Simulated Failure Mode:</span>
                <span className="text-cyan-400 font-bold">
                  {prediction.confidence}
                </span>
              </div>

              <h4 className="text-sm font-bold text-amber-200 leading-snug">
                {prediction.failureMode}
              </h4>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
                <span>Estimated RUL:</span>
                <span className="font-bold text-white">
                  {prediction.rulHours}
                </span>
              </div>
            </div>

            {/* Simulated Feature Attribution */}
            <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider flex items-center justify-between">
                <span>Simulated Feature Attribution</span>
                <span className="text-cyan-400">Relative %</span>
              </span>

              {[
                {
                  label: "Vibration Amplitude",
                  value: prediction.shap.vibration,
                  color: "bg-cyan-400",
                },
                {
                  label: "Casing Temperature",
                  value: prediction.shap.temperature,
                  color: "bg-amber-400",
                },
                {
                  label: "Phase Current",
                  value: prediction.shap.current,
                  color: "bg-sky-400",
                },
                {
                  label: "Other Factors",
                  value: prediction.shap.other,
                  color: "bg-purple-400",
                },
              ].map((feature) => (
                <div key={feature.label}>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-300">
                    <span>{feature.label}</span>
                    <span>{feature.value}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full ${feature.color}`}
                      style={{ width: `${feature.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Maintenance Recommendation */}
            <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                <Wrench size={12} />
                Simulated Maintenance Recommendation
              </span>

              <p className="mt-1.5 text-zinc-300 text-[11px] leading-relaxed">
                {prediction.action}
              </p>
            </div>

            {/* REAL BACKEND ML PREDICTION */}
            <div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Brain size={18} className="text-cyan-400" />

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Trained ML Model
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Prediction from the backend API
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Enter the five features expected by your trained model.
                These inputs are kept separate from the dashboard readings
                because they measure different things.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-zinc-300 space-y-1">
                  <span className="block">
                    Air Temperature (K)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={airTemperature}
                    onChange={(e) => setAirTemperature(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-zinc-300 space-y-1">
                  <span className="block">
                    Process Temperature (K)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={processTemperature}
                    onChange={(e) => setProcessTemperature(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-zinc-300 space-y-1">
                  <span className="block">
                    Rotational Speed (rpm)
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={mlRpm}
                    onChange={(e) => setMlRpm(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-zinc-300 space-y-1">
                  <span className="block">
                    Torque (Nm)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={torque}
                    onChange={(e) => setTorque(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-zinc-300 space-y-1 sm:col-span-2">
                  <span className="block">
                    Tool Wear (min)
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={toolWear}
                    onChange={(e) => setToolWear(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={runMLPrediction}
                disabled={mlLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-bold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mlLoading ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Running Trained Model...
                  </>
                ) : (
                  <>
                    <Brain size={15} />
                    Run Trained ML Prediction
                  </>
                )}
              </button>

              {mlError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Prediction request failed</p>
                    <p className="mt-1 break-words">{mlError}</p>
                    <p className="mt-2">
                      Check that the backend on port 8000 and ML API on port
                      8001 are running, then try again.
                    </p>
                  </div>
                </div>
              )}

              {mlPrediction && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {mlPrediction.predicted_failure === 1 ? (
                      <AlertCircle
                        size={20}
                        className="text-red-400"
                      />
                    ) : (
                      <CheckCircle2
                        size={20}
                        className="text-emerald-400"
                      />
                    )}

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                        Backend Model Result
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          mlPrediction.predicted_failure === 1
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {mlPrediction.status}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-zinc-900 p-3">
                      <p className="text-[10px] text-zinc-400">
                        Predicted Failure
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {mlPrediction.predicted_failure}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        1 = failure flag, 0 = no failure flag
                      </p>
                    </div>

                    <div className="rounded-lg bg-zinc-900 p-3">
                      <p className="text-[10px] text-zinc-400">
                        Estimated Probability
                      </p>
                      <p className="mt-1 text-xl font-bold text-cyan-300">
                        {(
                          Number(
                            mlPrediction.estimated_failure_probability
                          ) * 100
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {mlPrediction.model_note}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-zinc-500 leading-relaxed">
                The initial values are example inputs for testing the API,
                not readings from the selected machine. This prototype
                should not be used to make real-world safety decisions.
              </p>
            </div>
          </div>

          {/* Existing Live Alert Dispatch */}
          <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
            <button
              onClick={handleDispatchAlert}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-mono font-bold text-zinc-950 hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
            >
              <Send size={14} />
              <span>Dispatch as Live System Alert</span>
            </button>

            {dispatchedNotice && (
              <p className="text-center text-[11px] font-mono text-emerald-400">
                ✓ {dispatchedNotice}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}