// src/components/LineTile.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cardColors } from '../theme';

export function LineTile({ title, card, data }) {
  const { bg, border, line } = cardColors(card);

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid vertical={false} strokeOpacity={0.2} />
            <XAxis dataKey="x" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => Number(v).toFixed(1)} />
            {/* Primary line matches card color */}
            <Line type="monotone" dataKey="y" stroke={line} strokeWidth={2} dot={false} />
            {/* Optional moving average if provided */}
            {data.some(d => d.avg !== undefined) && (
              <Line
                type="monotone"
                dataKey="avg"
                stroke={border}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}