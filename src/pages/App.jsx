import React, { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import NotFound from "@/pages/NotFound.jsx"; // if you don't have this, replace with Dashboard
import { supabase } from "@/lib/supabase";
import DebugOverlay from "@/components/debug/DebugOverlay.jsx";
export default function App() {
  const loc = useLocation();
 return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial", color: "#111" }}>
      <h1>Sentinel Health</h1>
      <p>If you see this, React is mounted and routing/auth haven’t run yet.</p>
    </div>
 );
}
  