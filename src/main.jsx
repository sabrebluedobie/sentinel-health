import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "./auth/AuthGate";
import AppShell from "./AppShell";        // layout for /app/*
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
// ...other imports

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* public */}
      <Route path="/login" element={<LoginPage />} />

      {/* protected */}
      <Route
        path="/app/*"
        element={
          <AuthGate>
            <AppShell />
          </AuthGate>
        }
      >
        <Route index element={<Dashboard />} />
        {/* more /app routes... */}
      </Route>

      {/* default -> app (or landing) */}
      <Route path="*" element={<AuthGate><AppShell /></AuthGate>} />
    </Routes>
  </BrowserRouter>
);
