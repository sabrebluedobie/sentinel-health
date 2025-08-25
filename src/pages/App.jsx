import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Protected from '@/routes/Protected.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import SignIn from '@/pages/SignIn.jsx';
import LogGlucose from '@/pages/LogGlucose.jsx';
import LogSleep from '@/pages/LogSleep.jsx';
import LogMigraine from '@/pages/LogMigraine.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/log-migraine" element={<Protected><LogMigraine /></Protected>} />
      <Route path="/log/glucose" element={<Protected><LogGlucose /></Protected>} />
      <Route path="/log-glucose" element={<Protected><LogGlucose /></Protected>} />
      <Route path="/log/sleep" element={<Protected><LogSleep /></Protected>} />
      <Route path="/log-sleep" element={<Protected><LogSleep /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
