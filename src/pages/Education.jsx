// src/pages/Education.jsx
import React from "react";

export default function Education() {
  return (
    <div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 className="h1" style={{ textAlign: "left" }}>Education</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        Quick references and tips for tracking migraines, sleep, and glucose.
      </p>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Migraine basics</h3>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>Track <strong>start/end time</strong> and <strong>severity</strong> (0–10).</li>
            <li>Note likely <strong>triggers</strong> (stress, foods, weather, sleep).</li>
            <li>Record <strong>medications</strong> and relief time.</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Sleep tracking</h3>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>Log <strong>bedtime/wake time</strong> and <strong>total hours</strong>.</li>
            <li>Optional: quality (1–5) and naps.</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Blood glucose</h3>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>Record value (mg/dL) and whether it’s <strong>CGM</strong> or <strong>fingerstick</strong>.</li>
            <li>Add context (meal, exercise, correction).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
