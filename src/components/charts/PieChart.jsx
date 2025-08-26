import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Tooltip } from "recharts";

export default function PieChart({ labels = [], values = [], colors = [], className = "" }) {
  const rows = useMemo(
    () => labels.map((name, i) => ({ name, value: Number(values?.[i] ?? 0) })),
    [labels, values]
  );
  const hasData = useMemo(() => rows.some(r => r.value > 0), [rows]);
  const palette = colors.length ? colors : ["#6d28d9", "#1e40af", "#b91c1c", "#0ea5e9", "#16a34a", "#f59e0b"];

  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 240, background: "#ececec", borderRadius: 12 }}>
      {!hasData ? (
        <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#6b7280", fontSize: 14 }}>
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" isAnimationActive={false}>
              {rows.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12 }} />
          </RPieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}