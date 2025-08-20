// src/components/charts/LineChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

export default function LineChart({ labels, data, title }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <Line
        data={{
          labels,
          datasets: [{ label: title, data, tension: 0.3 }]
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { maxRotation: 0 } }, y: { beginAtZero: true } }
        }}
      />
    </div>
  );
}
