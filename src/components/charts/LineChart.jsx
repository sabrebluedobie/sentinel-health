import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

export default function LineChart({ labels, data, title, className = "h-[280px]" }) {
  return (
    <div className={`bg-white rounded-lg p-3 sm:p-4 shadow w-full ${className}`}>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="relative w-full h-[calc(100%-1.75rem)]">
        <Line
          data={{ labels, datasets: [{ label: title, data, tension: 0.3 }] }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { intersect: false, mode: "index" } },
            scales: { x: { ticks: { maxRotation: 0 } }, y: { beginAtZero: true } }
          }}
        />
      </div>
    </div>
  );
}
