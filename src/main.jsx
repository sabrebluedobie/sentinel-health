import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "@/components/AuthContext.jsx";
import { DimModeProvider } from "@/components/DimModeContext.jsx";

// Initialize Sentry BEFORE render
import "../sentry.client.config.js";
import * as Sentry from "@sentry/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
      <DimModeProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </DimModeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
