import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function LineChart({ labels = [], values = [], color = "#2563eb", className = "" }) {
  const data = useMemo(
    () => (labels || []).map((label, i) => ({ label, value: values?.[i] ?? null })),
    [labels, values]
  );
  const hasData = useMemo(() => data.some(d => d.value !== null && d.value !== undefined), [data]);

  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 240, background: "#ececec", borderRadius: 12 }}>
      {!hasData ? (
        <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#6b7280", fontSize: 14 }}>
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RLineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} tickMargin={8} minTickGap={16} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} width={40} />
            <Tooltip contentStyle={{ fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </RLineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}