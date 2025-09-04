// src/main.jsx (essentials only)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthContext.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import App from "@/pages/App.jsx";
import SignIn from "@/pages/SignIn.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import "./index.css"

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* public routes */}
        <Route path="/sign-in" element={<SignIn />} />

        {/* private routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-migraine"
          element={
            <ProtectedRoute>
              <LogMigraine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-glucose"
          element={
            <ProtectedRoute>
              <LogGlucose />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-sleep"
          element={
            <ProtectedRoute>
              <LogSleep />
            </ProtectedRoute>
          }
        />

        {/* catch-all */}
        <Route path="*" element={<SignIn />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);