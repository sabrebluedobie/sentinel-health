// src/router.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import App from "@/pages/App.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/src/components/SignIn.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import NightscoutSettings from "@/src/pages/NightscoutSettings.jsx";
import Protected from "@/routes/Protected.jsx";

export default function Router() {
  return (
    <Routes>
      <Route element={<App />}>
        {/* public */}
        <Route path="/sign-in" element={<SignIn />} />
        {/* private */}
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/log-migraine"
          element={
            <Protected>
              <LogMigraine />
            </Protected>
          }
        />
        <Route
          path="/log-glucose"
          element={
            <Protected>
              <LogGlucose />
            </Protected>
          }
        />
        <Route
          path="/log-sleep"
          element={
            <Protected>
              <LogSleep />
            </Protected>
          }
        />
        <Route
          path="/nightscout-settings"
          element={
            <Protected>
              <NightscoutSettings />
            </Protected>
          }
        />
        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
      </Route>
    </Routes>
  );
}