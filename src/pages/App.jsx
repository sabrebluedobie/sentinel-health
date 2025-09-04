import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx";
import Reset from "@/pages/Reset.jsx";

const Dashboard   = React.lazy(() => import("@/pages/Dashboard.jsx"));
const LogGlucose  = React.lazy(() => import("@/pages/LogGlucose.jsx"));
const LogSleep    = React.lazy(() => import("@/pages/LogSleep.jsx"));
const LogMigraine = React.lazy(() => import("@/pages/LogMigraine.jsx"));

export default function App() {
  return (
    <React.Suspense fallback={<div className="p-6">Loading…</div>}>
      <Routes>
        {/* Auth routes (unprotected) */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/reset"   element={<Reset />} />

        {/* App routes (protected) */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/log-glucose"  element={<ProtectedRoute><LogGlucose /></ProtectedRoute>} />
        <Route path="/log-sleep"    element={<ProtectedRoute><LogSleep /></ProtectedRoute>} />
        <Route path="/log-migraine" element={<ProtectedRoute><LogMigraine /></ProtectedRoute>} />

        <Route path="*" element={<div className="p-6">Not found</div>} />
      </Routes>
    </React.Suspense>
  );
}