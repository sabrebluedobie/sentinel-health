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
  showDots = true,     // NEW: whether to show data point dots
  dotInterval = 12,    // NEW: show dot every Nth point (12 = ~hourly for 5min CGM data)
  tickFormatter,       // optional custom tick formatter
  strokeColor = "#8b5cf6", // NEW: customizable line color
}) {
  const isNumberAxis = data.length && typeof data[0]?.[xKey] === "number";

  const formatTick =
    tickFormatter ||
    (isNumberAxis
      ? (v) => new Date(v).toLocaleDateString()
      : (v) => String(v));

  const formatLabel = (v) =>
    isNumberAxis ? new Date(v).toLocaleString() : String(v);

  // Custom dot renderer to show dots at intervals
  const renderDot = (props) => {
    if (!showDots) return null;
    
    const { index, cx, cy } = props;
    
    // Show dot at intervals (or all dots if data is small)
    if (data.length <= 20 || index % dotInterval === 0) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill={strokeColor}
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

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
          <Line 
            type="monotone" 
            dataKey={yKey} 
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dot={renderDot}
            activeDot={{ r: 6, fill: strokeColor, stroke: "#fff", strokeWidth: 2 }}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}