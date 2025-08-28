// src/components/charts/LineChart.jsx
import React from "react";
import {
  LineChart as RLineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * Reusable line chart wrapper.
 * NOTE: We alias Recharts' LineChart to RLineChart to avoid name clashes.
 */
export default function AppLineChart({
  data = [],           // [{ t: number|category, v: number }, ...]
  xKey = "t",
  yKey = "v",
  height = 220,
  unit = "",           // e.g. "mg/dL"
  strokeWidth = 2,
  showGrid = true,
  tickFormatter,       // optional custom tick formatter
}) {
  const isNumberAxis = data.length && typeof data[0]?.[xKey] === "number";

  const formatTick =
    tickFormatter ||
    (isNumberAxis
      ? (v) => new Date(v).toLocaleDateString()
      : (v) => String(v));

  const formatLabel = (v) =>
    isNumberAxis ? new Date(v).toLocaleString() : String(v);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RLineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xKey}
            type={isNumberAxis ? "number" : "category"}
            domain={isNumberAxis ? ["dataMin", "dataMax"] : undefined}
            tickFormatter={formatTick}
            minTickGap={24}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={formatLabel}
            formatter={(val) => [unit ? `${val} ${unit}` : val, yKey]}
          />
          <Line type="monotone" dataKey={yKey} dot={false} strokeWidth={strokeWidth} />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}
