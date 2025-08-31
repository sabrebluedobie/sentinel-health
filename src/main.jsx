import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import App from "./pages/App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LogGlucose from "./pages/LogGlucose.jsx";
import LogSleep from "./pages/LogSleep.jsx";
import LogMigraine from "./pages/LogMigraine.jsx";
import Settings from "./pages/Settings.jsx";
import SignIn from "./pages/SignIn.jsx";
import AuthGate from "./auth/AuthGate.jsx";
import ErrorBoundary from "./components/debug/ErrorBoundary.jsx";


createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/app" element={<AuthGate><App /></AuthGate>}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="/log-glucose"  element={<AuthGate><LogGlucose /></AuthGate>} />
        <Route path="/log-sleep"    element={<AuthGate><LogSleep /></AuthGate>} />
        <Route path="/log-migraine" element={<AuthGate><LogMigraine /></AuthGate>} />
        <Route path="/settings"     element={<AuthGate><Settings /></AuthGate>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);
