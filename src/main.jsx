import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import { AuthProvider } from "@/components/AuthContext.jsx";
import "./index.css";
import App from "./App.jsx";

// Surface runtime errors to the console (and boundary)
window.addEventListener("error", (e) => console.error("[window.onerror]", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error("[unhandledrejection]", e.reason));

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
);