import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";

// …

<Routes>
  {/* public */}
  <Route path="/sign-in" element={<SignIn />} />

  {/* dashboard entry */}
  <Route
    path="/app"
    element={
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    }
  />

  {/* ---- Quick Actions: accept both path styles ---- */}
  {/* Top-level */}
  <Route
    path="/log-glucose"
    element={
      <ProtectedRoute>
        <Layout><LogGlucose /></Layout>
      </ProtectedRoute>
    }
  />
  <Route
    path="/log-sleep"
    element={
      <ProtectedRoute>
        <Layout><LogSleep /></Layout>
      </ProtectedRoute>
    }
  />
  <Route
    path="/log-migraine"
    element={
      <ProtectedRoute>
        <Layout><LogMigraine /></Layout>
      </ProtectedRoute>
    }
  />

  {/* Nested under /app (so /app/log-*) also works */}
  <Route
    path="/app/log-glucose"
    element={
      <ProtectedRoute>
        <Layout><LogGlucose /></Layout>
      </ProtectedRoute>
    }
  />
  <Route
    path="/app/log-sleep"
    element={
      <ProtectedRoute>
        <Layout><LogSleep /></Layout>
      </ProtectedRoute>
    }
  />
  <Route
    path="/app/log-migraine"
    element={
      <ProtectedRoute>
        <Layout><LogMigraine /></Layout>
      </ProtectedRoute>
    }
  />

  {/* default */}
  <Route path="/" element={<Navigate to="/app" replace />} />
  <Route path="*" element={<NotFound />} />
</Routes>