import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

export default function PieChart({ labels, data, title, className = "h-[280px]" }) {
  return (
    <div className={`bg-white rounded-lg p-3 sm:p-4 shadow w-full ${className}`}>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="relative w-full h-[calc(100%-1.75rem)]">
        <Pie
          data={{ labels, datasets: [{ data }] }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } }
          }}
        />
      </div>
    </div>
  );
}
