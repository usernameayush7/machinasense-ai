
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

const sensors = {
  Vibration: {
    unit: "mm/s",
    color: "#00e5a0",
    threshold: 7,
    base: 4.2,
    variation: 1.8,
  },
  Temperature: {
    unit: "°C",
    color: "#fbbf24",
    threshold: 75,
    base: 62,
    variation: 9,
  },
  Current: {
    unit: "A",
    color: "#38bdf8",
    threshold: 25,
    base: 17,
    variation: 4,
  },
};

const ranges = {
  "15 min": { minutes: 15, points: 15 },
  "45 min": { minutes: 45, points: 15 },
  "2 hours": { minutes: 120, points: 24 },
};

function createReading(sensorName) {
  const sensor = sensors[sensorName];

  // Occasional higher readings make the demo look realistic.
  const spike = Math.random() < 0.08 ? sensor.variation * 1.5 : 0;
  const noise = (Math.random() - 0.5) * sensor.variation;

  return Number(
    Math.max(0, sensor.base + noise + spike).toFixed(2)
  );
}

function createInitialData(sensorName, rangeName) {
  const { minutes, points } = ranges[rangeName];
  const now = Date.now();

  return Array.from({ length: points }, (_, index) => {
    const time = new Date(
      now - (points - 1 - index) * (minutes * 60_000 / (points - 1))
    );

    return {
      time: time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      value: createReading(sensorName),
    };
  });
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs text-zinc-400">{label}</p>
      <p className="font-bold text-white">
        {payload[0].value}{" "}
        <span className="text-xs font-normal text-zinc-400">{unit}</span>
      </p>
    </div>
  );
}

export default function SensorChart() {
  const [sensorName, setSensorName] = useState("Vibration");
  const [rangeName, setRangeName] = useState("45 min");

  const sensor = sensors[sensorName];

  const initialData = useMemo(
    () => createInitialData(sensorName, rangeName),
    [sensorName, rangeName]
  );

  const [data, setData] = useState(initialData);

  // Reset the graph whenever the selected sensor or range changes.
  useEffect(() => {
    setData(createInitialData(sensorName, rangeName));
  }, [sensorName, rangeName]);

  // Simulate a new sensor reading every 4 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setData((previous) => {
        const next = [
          ...previous,
          {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            value: createReading(sensorName),
          },
        ];

        return next.slice(-ranges[rangeName].points);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [sensorName, rangeName]);

  const latestValue = data[data.length - 1]?.value ?? 0;
  const isAboveThreshold = latestValue > sensor.threshold;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:p-6">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Live telemetry / Demo
          </p>

          <h2 className="mt-2 text-xl font-bold text-white">
            Sensor Monitoring
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated equipment readings
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Updating every 4s
        </div>
      </div>

      {/* Sensor selector */}
      <div className="mt-6 flex flex-wrap gap-2">
        {Object.keys(sensors).map((name) => (
          <button
            key={name}
            onClick={() => setSensorName(name)}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              sensorName === name
                ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Time range selector */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {sensorName} trend
        </p>

        <div className="flex gap-1 rounded-lg bg-zinc-950 p-1">
          {Object.keys(ranges).map((range) => (
            <button
              key={range}
              onClick={() => setRangeName(range)}
              className={`rounded-md px-3 py-2 text-xs transition ${
                rangeName === range
                  ? "bg-zinc-800 text-emerald-300"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Current reading */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div>
          <p className="text-xs text-zinc-500">Latest reading</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {latestValue}
            </span>
            <span className="text-sm text-zinc-400">{sensor.unit}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500">Reference threshold</p>
          <p className="mt-1 font-semibold text-zinc-200">
            {sensor.threshold} {sensor.unit}
          </p>
          <p
            className={`mt-1 text-xs ${
              isAboveThreshold ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {isAboveThreshold ? "Above threshold" : "Within threshold"}
          </p>
        </div>
      </div>

      {/* Interactive time-series chart */}
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#27272a"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
              minTickGap={30}
            />

            <YAxis
              width={48}
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />

            <Tooltip
              content={<CustomTooltip unit={sensor.unit} />}
              cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }}
            />

            <ReferenceLine
              y={sensor.threshold}
              stroke="#f87171"
              strokeDasharray="5 5"
              label={{
                value: "Threshold",
                fill: "#f87171",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              name={sensorName}
              stroke={sensor.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                stroke: sensor.color,
                strokeWidth: 2,
                fill: "#09090b",
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        <span>{data.length} simulated readings displayed</span>
        <span>Red dashed line = reference threshold</span>
      </div>
    </section>
  );
}
