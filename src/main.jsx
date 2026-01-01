import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "@/components/AuthContext.jsx";
import { DimModeProvider } from "@/components/DimModeContext.jsx";
import { PostHogProvider } from "posthog-js/react";

// Initialize Sentry BEFORE render
import "../sentry.client.config.js";
import * as Sentry from "@sentry/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          defaults: '2025-05-24',
          capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
          debug: import.meta.env.MODE === "development",
        }}
      >
        <DimModeProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </DimModeProvider>
      </PostHogProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);