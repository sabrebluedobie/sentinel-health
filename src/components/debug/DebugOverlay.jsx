// src/components/debug/DebugOverlay.jsx
import React, { useEffect } from "react";

export default function DebugOverlay() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "force-visible-style";
    el.textContent = `
      /* Force readable UI regardless of global CSS */
      html, body, #root { color: #111 !important; background: #ececec !important; font-size: 16px !important; }
      h1,h2,h3,h4,h5,h6,p,span,div,button,label,input,textarea,select,li,a,strong,em,small {
        color: #111 !important; text-shadow: none !important; visibility: visible !important;
      }
      /* Avoid accidental "hidden" globals */
      *[hidden], .hidden { display: revert !important; }
      /* Ensure text actually paints */
      * { -webkit-text-fill-color: initial !important; }
    `;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 2147483647,
        top: 8,
        left: 8,
        padding: "8px 12px",
        background: "#fff",
        color: "#111",
        border: "1px solid #ddd",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <strong>Debug:</strong> UI rendered. Text forced visible.
    </div>
  );
}