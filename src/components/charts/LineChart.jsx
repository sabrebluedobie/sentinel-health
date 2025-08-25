import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart as RCLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function LineChart({
  labels = [],
  data = [],
  color,
  className,
  yDomain = ['auto', 'auto'],
  smooth = true,
  showAvg = false,
  avgWindow = 5,
}) {
  const points = useMemo(() => {
    const len = Math.min(labels.length, data.length);
    const arr = new Array(len);
    for (let i = 0; i < len; i++) arr[i] = { x: labels[i], y: data[i] == null ? null : Number(data[i]) };
    return arr;
  }, [labels, data]);

  const avgSeries = useMemo(() => {
    if (!showAvg || points.length === 0) return [];
    const out = [];
    let sum = 0, n = 0;
    for (let i = 0; i < points.length; i++) {
      const v = points[i].y;
      sum += v ?? 0;
      n += v == null ? 0 : 1;
      if (i >= avgWindow) {
        const old = points[i - avgWindow].y;
        sum -= old ?? 0;
        n -= old == null ? 0 : 1;
      }
      out.push({ x: points[i].x, y: n ? +(sum / n).toFixed(1) : null });
    }
    return out;
  }, [points, showAvg, avgWindow]);

  const stroke = color || 'var(--chart-line, #2563eb)';
  const avgStroke = 'var(--chart-accent, rgba(0,0,0,.45))';

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <RCLineChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(0,0,0,.06)" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 12 }} tickMargin={6} minTickGap={24} axisLine={false} tickLine={false} />
          <YAxis domain={yDomain} tick={{ fontSize: 12 }} width={36} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,.1)' }} labelStyle={{ fontWeight: 600 }} />
          <Line
            type={smooth ? 'monotone' : 'linear'}
            dataKey="y"
            stroke={stroke}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          {showAvg && (
            <Line
              type="monotone"
              data={avgSeries}
              dataKey="y"
              stroke={avgStroke}
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          )}
        </RCLineChart>
      </ResponsiveContainer>
    </div>
  );
}