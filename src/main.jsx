import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router.jsx";
import { AuthProvider } from "./providers/AuthProvider.jsx";
import "./index.css";


// --- Tiny on-screen error overlay (works on iPad/iPhone) ---
function showFatal(msg) {
  const el = document.createElement("pre");
  el.style.cssText =
    "white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;" +
    "background:#111827;color:#ffe4e6;border:1px solid #4b5563;" +
    "padding:12px;border-radius:10px;max-width:900px;margin:16px auto;";
  el.textContent = `App failed to start:\n\n${msg}`;
  document.body.innerHTML = "";
  document.body.appendChild(el);
}

// Capture any uncaught runtime errors and display them
window.addEventListener("error", (e) => showFatal(e?.error?.stack || e.message || String(e)));
window.addEventListener("unhandledrejection", (e) => {
  showFatal((e?.reason && (e.reason.stack || e.reason.message)) || String(e?.reason || e));
});

// Minimal environment sanity (common blank-page causes)
(function sanity() {
  const need = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
  const miss = need.filter((k) => !import.meta.env?.[k]);
  if (miss.length) {
    showFatal(
      `Missing required env(s): ${miss.join(
        ", "
      )}\n\nAdd them in Vercel → Project → Settings → Environment Variables (Production & Preview) and redeploy.`
    );
    throw new Error("Missing required env"); // stop boot
  }
})();

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    showFatal("No #root element in index.html");
  } else {
    ReactDOM.createRoot(rootEl).render(<App />);
  }
} catch (err) {
  showFatal(err?.stack || err?.message || String(err));
}