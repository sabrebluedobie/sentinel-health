import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Layout from "@/layout";

const Placeholder = ({title}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p>Page content will go here.</p>
    <nav className="space-x-3">
      <Link className="underline" to="/Dashboard">Dashboard</Link>
      <Link className="underline" to="/LogMigraine">LogMigraine</Link>
      <Link className="underline" to="/SleepTracker">SleepTracker</Link>
      <Link className="underline" to="/GlucoseLog">GlucoseLog</Link>
      <Link className="underline" to="/Analytics">Analytics</Link>
      <Link className="underline" to="/ExportReport">ExportReport</Link>
    </nav>
  </div>
);

export default function App(){
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/LogMigraine" element={<Placeholder title="Log Migraine" />} />
        <Route path="/SleepTracker" element={<Placeholder title="Sleep Tracker" />} />
        <Route path="/GlucoseLog" element={<Placeholder title="Glucose Log" />} />
        <Route path="/Analytics" element={<Placeholder title="Analytics" />} />
        <Route path="/ExportReport" element={<Placeholder title="Export Report" />} />
      </Routes>
    </Layout>
  );
}