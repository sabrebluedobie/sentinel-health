// src/components/charts/PieChart.jsx
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

export default function PieChart({ labels, data, title }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <Pie
        data={{
          labels,
          datasets: [{ data }]
        }}
        options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
      />
    </div>
  );
}
