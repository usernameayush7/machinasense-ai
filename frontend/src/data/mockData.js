// Mock data and initial definitions for MachinaSense
// Designed for realistic industrial fault detection & predictive maintenance

export const INITIAL_MACHINES = [
  {
    id: "CNC-001",
    name: "CNC Milling Machine 5-Axis",
    type: "Milling Center",
    location: "Bay A - Precision Machining",
    status: "Healthy",
    healthScore: 94,
    runtimeHours: 4280,
    mtbfHours: 3200,
    lastInspection: "2026-09-28",
    nextInspection: "2026-10-28",
    operator: "K. Vance (Shift 1)",
    sensors: {
      vibration: { value: 2.1, unit: "mm/s", threshold: 4.5, status: "normal", baseline: 1.8 },
      temperature: { value: 52.4, unit: "°C", threshold: 75.0, status: "normal", baseline: 50.0 },
      current: { value: 16.8, unit: "A", threshold: 28.0, status: "normal", baseline: 16.0 },
      rpm: { value: 11850, unit: "RPM", threshold: 12500, status: "normal", baseline: 12000 },
      pressure: { value: 6.2, unit: "bar", threshold: 8.0, status: "normal", baseline: 6.0 },
    },
    recommendations: [
      { id: "REC-01", priority: "Low", text: "Routine spindle coolant check recommended at next shift handoff.", timeframe: "Next 48 hrs" },
      { id: "REC-02", priority: "Info", text: "Spindle bearing vibration harmonic signature matches nominal ISO 10816 class.", timeframe: "Scheduled maintenance" }
    ],
    sparkline: [2.0, 2.1, 2.0, 2.2, 2.1, 2.3, 2.1, 2.2, 2.1, 2.0, 2.1, 2.1]
  },
  {
    id: "PMP-002",
    name: "Industrial Slurry Pump",
    type: "Centrifugal Pump",
    location: "Bay B - Fluid Handling",
    status: "Critical",
    healthScore: 48,
    runtimeHours: 8940,
    mtbfHours: 2100,
    lastInspection: "2026-08-15",
    nextInspection: "2026-10-18 (Urgent)",
    operator: "M. Torres (Shift 2)",
    sensors: {
      vibration: { value: 8.9, unit: "mm/s", threshold: 5.5, status: "critical", baseline: 3.2 },
      temperature: { value: 84.6, unit: "°C", threshold: 78.0, status: "critical", baseline: 62.0 },
      current: { value: 31.4, unit: "A", threshold: 30.0, status: "warning", baseline: 24.0 },
      rpm: { value: 1740, unit: "RPM", threshold: 1800, status: "normal", baseline: 1750 },
      pressure: { value: 3.1, unit: "bar", threshold: 5.5, status: "warning", baseline: 4.8 },
    },
    recommendations: [
      { id: "REC-03", priority: "Critical", text: "Urgent: High vibration and thermal signature indicate severe cavitation or bearing cage defect. Inspect pump impeller and mechanical seal immediately.", timeframe: "Immediate (< 2 hrs)" },
      { id: "REC-04", priority: "High", text: "Throttle intake valve to reduce turbulent fluid cavitation until mechanical inspection is performed.", timeframe: "Within 4 hrs" }
    ],
    sparkline: [3.4, 3.8, 4.2, 5.1, 6.0, 6.8, 7.4, 7.9, 8.2, 8.5, 8.8, 8.9]
  },
  {
    id: "MOT-003",
    name: "Heavy Conveyor Motor 75kW",
    type: "Induction Motor",
    location: "Bay C - Material Transfer",
    status: "Warning",
    healthScore: 72,
    runtimeHours: 6120,
    mtbfHours: 4500,
    lastInspection: "2026-09-10",
    nextInspection: "2026-10-20",
    operator: "D. Chen (Shift 1)",
    sensors: {
      vibration: { value: 4.8, unit: "mm/s", threshold: 4.0, status: "warning", baseline: 2.5 },
      temperature: { value: 71.2, unit: "°C", threshold: 80.0, status: "normal", baseline: 64.0 },
      current: { value: 27.8, unit: "A", threshold: 26.0, status: "warning", baseline: 21.0 },
      rpm: { value: 1475, unit: "RPM", threshold: 1500, status: "normal", baseline: 1480 },
      pressure: { value: 1.0, unit: "bar", threshold: 1.5, status: "normal", baseline: 1.0 },
    },
    recommendations: [
      { id: "REC-05", priority: "Medium", text: "Phase current imbalance detected (12% deviation). Inspect stator winding resistance and verify belt tension.", timeframe: "Within 24 hrs" },
      { id: "REC-06", priority: "Low", text: "Re-grease drive-end bearing with synthetic polyurea grease.", timeframe: "Next planned stoppage" }
    ],
    sparkline: [2.6, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5, 4.6, 4.8, 4.7, 4.8]
  },
  {
    id: "HPR-004",
    name: "Main Hydraulic Stamping Press",
    type: "Hydraulic System",
    location: "Bay A - Forming Unit",
    status: "Healthy",
    healthScore: 91,
    runtimeHours: 3410,
    mtbfHours: 5200,
    lastInspection: "2026-10-02",
    nextInspection: "2026-11-02",
    operator: "S. Al-Mansoor (Shift 2)",
    sensors: {
      vibration: { value: 1.9, unit: "mm/s", threshold: 4.0, status: "normal", baseline: 1.7 },
      temperature: { value: 49.3, unit: "°C", threshold: 70.0, status: "normal", baseline: 48.0 },
      current: { value: 42.1, unit: "A", threshold: 60.0, status: "normal", baseline: 40.0 },
      rpm: { value: 980, unit: "RPM", threshold: 1100, status: "normal", baseline: 1000 },
      pressure: { value: 210.4, unit: "bar", threshold: 250.0, status: "normal", baseline: 205.0 },
    },
    recommendations: [
      { id: "REC-07", priority: "Info", text: "Hydraulic fluid ISO particle count is within clean operational limits (NAS 6).", timeframe: "Monthly check" },
      { id: "REC-08", priority: "Low", text: "Inspect high-pressure proportional relief valve manifold seal rings during Q4 overhaul.", timeframe: "45 days" }
    ],
    sparkline: [1.8, 1.9, 1.8, 1.7, 1.9, 1.8, 1.9, 2.0, 1.8, 1.9, 1.9, 1.9]
  },
  {
    id: "CMP-005",
    name: "Dual-Stage Rotary Screw Air Compressor",
    type: "Air Compressor",
    location: "Utility Room 02",
    status: "Warning",
    healthScore: 68,
    runtimeHours: 11200,
    mtbfHours: 3800,
    lastInspection: "2026-09-05",
    nextInspection: "2026-10-16",
    operator: "T. Richter (Shift 1)",
    sensors: {
      vibration: { value: 3.9, unit: "mm/s", threshold: 4.2, status: "normal", baseline: 2.8 },
      temperature: { value: 77.8, unit: "°C", threshold: 75.0, status: "warning", baseline: 65.0 },
      current: { value: 38.6, unit: "A", threshold: 40.0, status: "normal", baseline: 35.0 },
      rpm: { value: 2980, unit: "RPM", threshold: 3100, status: "normal", baseline: 3000 },
      pressure: { value: 7.8, unit: "bar", threshold: 9.0, status: "normal", baseline: 7.5 },
    },
    recommendations: [
      { id: "REC-09", priority: "High", text: "Discharge air temperature elevated above 75°C threshold. Possible oil cooler fouling or thermo-bypass valve malfunction.", timeframe: "Within 12 hrs" },
      { id: "REC-10", priority: "Medium", text: "Clean air-oil separator elements and verify differential pressure gauge.", timeframe: "Within 36 hrs" }
    ],
    sparkline: [2.9, 3.0, 3.2, 3.4, 3.6, 3.5, 3.8, 3.7, 3.9, 3.8, 4.0, 3.9]
  }
];

export const INITIAL_ALERTS = [
  {
    id: "ALT-8841",
    machineId: "PMP-002",
    machineName: "Industrial Slurry Pump",
    faultType: "Impeller Cavitation & Bearing Cage Degradation",
    category: "Mechanical / Hydrodynamic",
    severity: "Critical",
    status: "Open", // Open | Acknowledged | Resolved
    confidence: "94.8% (Demo Inference)",
    timestamp: "18:24:12",
    duration: "14m ago",
    sensorEvidence: "Vibration 8.9 mm/s (threshold: 5.5 mm/s) + Temp 84.6°C (threshold: 78.0°C)",
    observedValue: "8.9 mm/s @ 120Hz & 84.6°C",
    expectedRange: "2.0 - 4.5 mm/s, < 72.0°C",
    explanation: "Broadband vibration amplitude spiking in high-frequency band accompanied by a steady 14°C rise in drive-end bearing casing temperature. Pattern strongly correlates with vapor bubble collapse causing pitting and mechanical bearing race stress.",
    recommendedAction: "1. Lock out / tag out pump PMP-002. 2. Inspect suction strainer for foreign debris blockage. 3. Check bearing play with dial indicator. 4. Sample lubricant for metallic debris.",
    assignedTo: "M. Torres",
    workOrder: "WO-2026-904",
  },
  {
    id: "ALT-8839",
    machineId: "MOT-003",
    machineName: "Heavy Conveyor Motor 75kW",
    faultType: "Phase Current Imbalance & Stator Thermal Gradient",
    category: "Electrical / Magnetic",
    severity: "High",
    status: "Open",
    confidence: "88.2% (Demo Inference)",
    timestamp: "18:11:45",
    duration: "27m ago",
    sensorEvidence: "Current 27.8 A (threshold: 26.0 A) with 4.8 mm/s vibration at 2x line frequency",
    observedValue: "Phase A: 27.8 A | Phase B: 24.1 A | Phase C: 23.9 A",
    expectedRange: "20.0 - 23.5 A balanced (±3% max)",
    explanation: "Phase A motor current draws 12% above nominal baseline with modulated vibration signature at 100Hz (2x slip frequency). Indicates possible inter-turn winding insulation leakage or mechanical belt over-tensioning.",
    recommendedAction: "Measure phase resistance with micro-ohmmeter, perform Megger insulation test, and inspect conveyor drive belt alignment.",
    assignedTo: "D. Chen",
    workOrder: "WO-2026-898",
  },
  {
    id: "ALT-8832",
    machineId: "CMP-005",
    machineName: "Dual-Stage Rotary Screw Air Compressor",
    faultType: "Thermal Bypass Restriction & Cooler Fouling",
    category: "Thermal / Fluid",
    severity: "Medium",
    status: "Acknowledged",
    confidence: "81.5% (Demo Inference)",
    timestamp: "17:42:09",
    duration: "56m ago",
    sensorEvidence: "Discharge Temp 77.8°C (threshold: 75.0°C)",
    observedValue: "77.8°C steady gradient",
    expectedRange: "60.0 - 72.0°C",
    explanation: "Gradual thermal creep observed over 4 hours under constant 7.8 bar operating pressure without corresponding increase in motor amps, indicating degraded heat exchanger cooling efficiency.",
    recommendedAction: "Clean external radiator fin pack with compressed air, verify cooling fan speed, and test thermostatic oil valve actuator opening stroke.",
    assignedTo: "T. Richter",
    workOrder: "WO-2026-879",
  },
  {
    id: "ALT-8815",
    machineId: "CNC-001",
    machineName: "CNC Milling Machine 5-Axis",
    faultType: "Micro-Vibration Transient (Tool Wear Warning)",
    category: "Operational / Tooling",
    severity: "Low",
    status: "Resolved",
    confidence: "74.0% (Demo Inference)",
    timestamp: "15:20:04",
    duration: "3h ago",
    sensorEvidence: "Vibration 3.8 mm/s transient peak (threshold: 4.5 mm/s)",
    observedValue: "3.8 mm/s transient during roughing pass",
    expectedRange: "1.5 - 2.8 mm/s nominal",
    explanation: "Short vibration transient recorded during high-feed pocket milling pass. Resolved after operator inspected end-mill carbide insert and indexed to fresh cutting edge.",
    recommendedAction: "Index milling insert corner #3. Verify spindle taper runout < 0.005mm.",
    assignedTo: "K. Vance",
    workOrder: "WO-2026-862",
  }
];

export const INITIAL_ACTIVITIES = [
  { id: "ACT-01", type: "anomaly", text: "Critical anomaly detected on Industrial Slurry Pump PMP-002 (Vibration breach 8.9 mm/s).", time: "2 min ago", severity: "critical" },
  { id: "ACT-02", type: "telemetry", text: "Telemetry batch ingested: 5 machines, 15 sensor channels updated.", time: "4 min ago", severity: "info" },
  { id: "ACT-03", type: "ack", text: "Operator T. Richter acknowledged alert ALT-8832 on Air Compressor CMP-005.", time: "18 min ago", severity: "warning" },
  { id: "ACT-04", type: "evaluation", text: "Automated model validation test completed on held-out test split (F1 score: 96.4%).", time: "35 min ago", severity: "healthy" },
  { id: "ACT-05", type: "resolved", text: "Alert ALT-8815 resolved on CNC-001 following tool insert indexing.", time: "1 hr ago", severity: "healthy" },
  { id: "ACT-06", type: "telemetry", text: "Baseline calibration verified for Hydraulic Press HPR-004.", time: "2 hrs ago", severity: "info" }
];

export const MODEL_EVALUATION = {
  f1Score: 0.964,
  precision: 0.958,
  recall: 0.971,
  rocAuc: 0.989,
  accuracy: 0.967,
  meanLatencyMs: 12.4,
  testSamplesCount: 24800,
  datasetName: "Industrial Sensor Multi-Condition Test Split (C-MAPSS & IMS Benchmark Synth)",
  confusionMatrix: {
    truePositive: 582,
    falsePositive: 26,
    falseNegative: 17,
    trueNegative: 24175,
  },
  failureModes: [
    { mode: "Bearing Race Defect", samples: 1420, precision: 97.4, recall: 98.1, f1: 97.7 },
    { mode: "Cavitation / Flow Disruption", samples: 1105, precision: 95.1, recall: 96.8, f1: 95.9 },
    { mode: "Motor Stator / Current Imbalance", samples: 980, precision: 94.6, recall: 95.9, f1: 95.2 },
    { mode: "Thermal Runaway / Cooling Failure", samples: 850, precision: 98.2, recall: 97.5, f1: 97.8 },
    { mode: "Mechanical Misalignment / Looseness", samples: 730, precision: 93.8, recall: 96.2, f1: 95.0 }
  ],
  rocCurve: [
    { fpr: 0.00, tpr: 0.00 },
    { fpr: 0.01, tpr: 0.72 },
    { fpr: 0.02, tpr: 0.88 },
    { fpr: 0.03, tpr: 0.94 },
    { fpr: 0.05, tpr: 0.97 },
    { fpr: 0.10, tpr: 0.99 },
    { fpr: 0.20, tpr: 0.995 },
    { fpr: 1.00, tpr: 1.00 }
  ]
};
