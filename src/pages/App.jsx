import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import TopNav from "@/components/TopNav.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx";
import Reset from "@/pages/Reset.jsx";


const Dashboard   = React.lazy(() => import("@/pages/Dashboard.jsx"));
const LogGlucose  = React.lazy(() => import("@/pages/LogGlucose.jsx"));
const LogSleep    = React.lazy(() => import("@/pages/LogSleep.jsx"));
const LogMigraine = React.lazy(() => import("@/pages/LogMigraine.jsx"));
const LogPain     = React.lazy(() => import("@/pages/LogPain.jsx"));
const Education   = React.lazy(() => import("@/pages/Education.jsx"));
const Settings    = React.lazy(() => import("@/pages/Settings.jsx"));

export default function App() {
  const location = useLocation();
  
  // Check if we're on a public auth page (no TopNav needed)
  const isAuthPage = ['/sign-in', '/sign-up', '/reset'].includes(location.pathname);

  return (
    <React.Suspense fallback={<div className="p-6">Loading…</div>}>
      {/* Show TopNav only on protected pages */}
      {!isAuthPage && <TopNav />}
      
      <main className={!isAuthPage ? "mx-auto max-w-6xl p-6" : ""}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/reset"   element={<Reset />} />

          {/* Private app routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/glucose"  element={<ProtectedRoute><LogGlucose /></ProtectedRoute>} />
          <Route path="/sleep"    element={<ProtectedRoute><LogSleep /></ProtectedRoute>} />
          <Route path="/migraine" element={<ProtectedRoute><LogMigraine /></ProtectedRoute>} />
          <Route path="/pain"     element={<ProtectedRoute><LogPain /></ProtectedRoute>} />
          <Route path="/education"    element={<ProtectedRoute><Education /></ProtectedRoute>} />
          <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<SignIn />} />
        </Routes>
      </main>
    </React.Suspense>
  );
}
