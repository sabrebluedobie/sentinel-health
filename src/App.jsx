import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import SignIn from '@/pages/SignIn.jsx';

// Replace these with your real pages/components
const Dashboard    = React.lazy(() => import('@/pages/Dashboard.jsx'));
const LogGlucose   = React.lazy(() => import('@/pages/LogGlucose.jsx'));
const LogSleep     = React.lazy(() => import('@/pages/LogSleep.jsx'));
const LogMigraine  = React.lazy(() => import('@/pages/LogMigraine.jsx'));

export default function App() {
  return (
    <React.Suspense fallback={<div style={{padding:24}}>Loading…</div>}>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/log-glucose"  element={<ProtectedRoute><LogGlucose /></ProtectedRoute>} />
        <Route path="/log-sleep"    element={<ProtectedRoute><LogSleep /></ProtectedRoute>} />
        <Route path="/log-migraine" element={<ProtectedRoute><LogMigraine /></ProtectedRoute>} />
        <Route path="*" element={<div style={{padding:24}}>Not found</div>} />
      </Routes>
    </React.Suspense>
  );
}