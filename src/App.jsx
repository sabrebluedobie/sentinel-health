import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import TopNav from "@/components/TopNav.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx";
import Reset from "@/pages/Reset.jsx";
import DimModeControl from '@/components/DimModeControl.jsx';

import { supabase } from "@/lib/supabase";
          // ✅ adjust path if needed
import { useModuleProfile } from "@/hooks/useModuleProfile.js"; // ✅ adjust path if needed

const Dashboard     = React.lazy(() => import("@/pages/Dashboard.jsx"));
const LogGlucose    = React.lazy(() => import("@/pages/LogGlucose.jsx"));
const LogSleep      = React.lazy(() => import("@/pages/LogSleep.jsx"));
const LogMigraine   = React.lazy(() => import("@/pages/LogMigraine.jsx"));
const LogPain       = React.lazy(() => import("@/pages/LogPain.jsx"));
const LogMedication = React.lazy(() => import("@/pages/LogMedication.jsx"));
const InsightsPage     = React.lazy(() => import("@/pages/InsightsPage.jsx"));
const Education     = React.lazy(() => import("@/pages/Education.jsx"));
const Settings    = React.lazy(() => import("@/pages/Settings.jsx"));
const Reports     = React.lazy(() => import("@/pages/Reports.jsx"));

// ✅ Your onboarding page (you said you added Modules.jsx)
const ModulesOnboarding = React.lazy(() => import("@/pages/onboarding/Modules.jsx")); 
// ^ adjust path to wherever you put it (could be "@/pages/Modules.jsx")

function ModuleEnabledGuard({ user, moduleKey, children }) {
  const { profile, onboardingRequired, loading: profileLoading } = useModuleProfile(user);

  if (!user) return <Navigate to="/sign-in" replace />;
  if (profileLoading) return <div className="p-6">Loading…</div>;

  const enabled = !!profile?.enabled_modules?.[moduleKey];
  if (!enabled) return <Navigate to="/settings" replace />; // or "/" if you prefer

  return children;
}

export default function App() {
  const location = useLocation();

  // Public auth pages (no TopNav needed)
  const isAuthPage = ["/sign-in", "/sign-up", "/reset"].includes(location.pathname);
  const isOnboardingPage = location.pathname.startsWith("/onboarding");

  // ✅ Track Supabase user here so we can drive onboarding/module gates
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user || null);
      setAuthLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // ✅ Pull module profile status (only meaningful when user exists)
  const { profile, onboardingRequired, loading: profileLoading } = useModuleProfile(user);


  // ✅ One-time onboarding gate (avoid loops + don’t run on auth pages)
  const shouldForceOnboarding =
    !isAuthPage &&
    !isOnboardingPage &&
    !!user &&
    !authLoading &&
    !profileLoading &&
    !!onboardingRequired;

  return (
    <React.Suspense fallback={<div className="p-6">Loading…</div>}>
      {shouldForceOnboarding && <Navigate to="/onboarding/modules" replace />}

      {/* Show TopNav only on protected pages + onboarding pages */}
      {!isAuthPage && <TopNav moduleProfile={profile} moduleProfileLoading={profileLoading} />}


      <main className={!isAuthPage ? "mx-auto max-w-6xl p-6" : ""}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/reset"   element={<Reset />} />

          {/* Onboarding (protected) */}
          <Route
            path="/onboarding/modules"
            element={
              <ProtectedRoute>
                <ModulesOnboarding />
              </ProtectedRoute>
            }
          />

          {/* Private app routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard moduleProfile={profile} moduleProfileLoading={profileLoading} />
              </ProtectedRoute>
            }
          />

          {/* Module-gated routes */}
          <Route
            path="/glucose"
            element={
              <ProtectedRoute>
                <ModuleEnabledGuard user={user} moduleKey="glucose">
                  <LogGlucose />
                </ModuleEnabledGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sleep"
            element={
              <ProtectedRoute>
                <ModuleEnabledGuard user={user} moduleKey="sleep">
                  <LogSleep />
                </ModuleEnabledGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/migraine"
            element={
              <ProtectedRoute>
                <ModuleEnabledGuard user={user} moduleKey="migraine">
                  <LogMigraine />
                </ModuleEnabledGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pain"
            element={
              <ProtectedRoute>
                <ModuleEnabledGuard user={user} moduleKey="pain">
                  <LogPain />
                </ModuleEnabledGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/medication"
            element={
              <ProtectedRoute>
                <ModuleEnabledGuard user={user} moduleKey="medication">
                  <LogMedication />
                </ModuleEnabledGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <InsightsPage />
              </ProtectedRoute>
            }
          />


          {/* Not gated (or you can gate them too if you want) */}
          <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={user ? "/" : "/sign-in"} replace />} />
        </Routes>
      </main>
    </React.Suspense>
  );
}
