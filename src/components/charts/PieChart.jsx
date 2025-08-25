import React from 'react';
import { ResponsiveContainer, PieChart as RCPieChart, Pie, Cell, Tooltip } from 'recharts';

export default function PieChart({
  labels = [],
  data = [],
  colors = [],
  className,
  innerRadius = 48,
  outerRadius = 80,
}) {
  const series = labels.map((l, i) => ({ name: l, value: Number(data[i] ?? 0) }));
  const fallbacks = ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];
  const palette = (colors && colors.length ? colors : fallbacks);

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <RCPieChart>
          <Pie
            data={series}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
          >
            {series.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,.1)' }} />
        </RCPieChart>
      </ResponsiveContainer>
    </div>
  );
}