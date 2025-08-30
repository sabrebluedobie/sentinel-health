// src/components/HeadacheTypesChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

export default function HeadacheTypesChart({ items = [], colorMap = {} }) {
  // Convert likelihood (0–1) → percent
  const pieData = items.map((i) => ({
    name: i.type,
    value: Math.round(i.likelihood * 1000) / 10, // one decimal %
  }));

  return (
    <div className="card" style={{ padding: 16, borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>Possible Headache Types</h2>
        <div className="muted">educational, not diagnosis</div>
      </div>

      <div style={{ height: 260, marginTop: 12 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData.length ? pieData : [{ name: 'no data', value: 1 }]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
            >
              {(pieData.length ? pieData : [{ name: 'no data' }]).map((slice, i) => (
                <Cell key={i} fill={colorMap[slice.name] || undefined} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v.toFixed?.(1) ?? v}%`, 'likelihood']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Key symptoms</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Likelihood</th>
            </tr>
          </thead>
          <tbody>
            {(items.length ? items : []).map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{row.type}</td>
                <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                  {Array.isArray(row.keySymptoms) ? row.keySymptoms.join(', ') : ''}
                </td>
                <td style={{ padding: 8, borderTop: '1px solid #eee', textAlign: 'right' }}>
                  {(row.likelihood * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        This visualization is for education only and is not medical advice. Seek professional evaluation for worrisome symptoms.
      </p>
    </div>
  );
}
