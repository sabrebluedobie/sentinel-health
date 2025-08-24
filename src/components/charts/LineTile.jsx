import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function LineTile({ data }) {
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--grid-stroke)" />
          <XAxis dataKey="x" tick={{ fontSize: 12, fill: 'var(--axis-tick)' }} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--axis-tick)' }} />
          <Tooltip formatter={(v) => Number(v).toFixed(1)} />
          {/* Primary series uses the card’s line color */}
          <Line type="monotone" dataKey="y" stroke="var(--line)" strokeWidth={2} dot={false} />
          {/* Optional moving average */}
          <Line type="monotone" dataKey="avg" stroke="var(--border)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}