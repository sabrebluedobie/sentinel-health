import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/debug/ErrorBoundary.jsx";
import { AuthProvider } from "@/providers/AuthProvider.jsx";
import App from "@/pages/App.jsx";
import "@/index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  const el = document.createElement("div");
  el.id = "root";
  document.body.appendChild(el);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);