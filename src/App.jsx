import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Protected from '@/routes/Protected.jsx';

import Dashboard from '@/pages/Dashboard.jsx';
import SignIn from '@/pages/SignIn.jsx';
import LogGlucose from '@/pages/LogGlucose.jsx';
import LogSleep from '@/pages/LogSleep.jsx';
import LogMigraine from '@/pages/LogMigraine.jsx';
import DebugPanel from '@/components/debug/DebugPanel.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/debug" element={<DebugPanel />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />

      {/* Migraine (primary: /log-migraine) */}
      <Route
        path="/log-migraine"
        element={
          <Protected>
            <LogMigraine />
          </Protected>
        }
      />
      {/* Back-compat alias */}
      <Route
        path="/log/migraine"
        element={
          <Protected>
            <LogMigraine />
          </Protected>
        }
      />

      {/* Glucose — support both styles */}
      <Route
        path="/log-glucose"
        element={
          <Protected>
            <LogGlucose />
          </Protected>
        }
      />
      <Route
        path="/log/glucose"
        element={
          <Protected>
            <LogGlucose />
          </Protected>
        }
      />

      {/* Sleep — support both styles */}
      <Route
        path="/log-sleep"
        element={
          <Protected>
            <LogSleep />
          </Protected>
        }
      />
      <Route
        path="/log/sleep"
        element={
          <Protected>
            <LogSleep />
          </Protected>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}