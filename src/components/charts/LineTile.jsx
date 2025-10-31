import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

/**
 * props:
 *  - data: [{ x: ISOString|number|string, y: number }, ...]
 *  - smooth: boolean (default true)
 *  - showAvg: boolean (default true) – draws a moving average trend line
 *  - avgWindow: integer (default 5)
 *  - yDomain: [min,max] | ['auto','auto']
 *  - showDots: boolean (default true) - show data point markers
 *  - dotInterval: integer (default 12) - show dot every Nth point
 */
export default function LineTile({
  data = [],
  smooth = true,
  showAvg = true,
  avgWindow = 5,
  yDomain = ['auto', 'auto'],
  showDots = true,
  dotInterval = 12,
}) {
  const prepared = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map(d => ({
      x: formatX(d.x),
      y: Number(d.y ?? d.value ?? d.value_mgdl ?? 0),
    }));
  }, [data]);

  const avgSeries = useMemo(() => {
    if (!showAvg || prepared.length === 0) return [];
    const arr = [];
    let sum = 0;
    for (let i = 0; i < prepared.length; i++) {
      sum += prepared[i].y;
      if (i >= avgWindow) sum -= prepared[i - avgWindow].y;
      arr.push({ x: prepared[i].x, y: i >= avgWindow - 1 ? +(sum / avgWindow).toFixed(1) : null });
    }
    return arr;
  }, [prepared, showAvg, avgWindow]);

  const stroke = 'var(--chart-line)';
  const avgStroke = 'var(--chart-accent)';

  // Custom dot renderer to show dots at intervals
  const renderDot = (props) => {
    if (!showDots) return null;
    
    const { index, cx, cy } = props;
    
    // Show dot at intervals (or all dots if data is small)
    if (prepared.length <= 20 || index % dotInterval === 0) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill={stroke}
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={prepared} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(0,0,0,.06)" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 12 }}
            tickMargin={6}
            minTickGap={24}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 12 }}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,.1)' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Line
            type={smooth ? 'monotone' : 'linear'}
            dataKey="y"
            stroke={stroke}
            strokeWidth={2.5}
            dot={renderDot}
            activeDot={{ r: 6, fill: stroke, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
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
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatX(v) {
  if (!v) return '';
  // Accept Date, ISO string, or bare label
  const d = (v instanceof Date) ? v : (typeof v === 'string' && !Number.isFinite(+v) ? new Date(v) : null);
  if (d && !isNaN(d.getTime())) {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  return String(v);
}