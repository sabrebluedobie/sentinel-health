import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router.jsx";
import { AuthProvider } from "./providers/AuthProvider.jsx";
import "./index.css";

// ✅ use the React entry for Vite/React apps
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      {/* Place these once near the root */}
      <Analytics />
      <SpeedInsights />
    </AuthProvider>
  </React.StrictMode>
);
