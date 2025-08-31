// src/pages/Education.jsx
import React, { useEffect } from "react";

export default function Education() {
  // Optional: ensure the page starts at top on mount
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // ignore if not supported
    }
  }, []);

  return (
    <main className="education-page" style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.2 }}>Education</h1>
        <p style={{ marginTop: ".5rem", color: "#555" }}>
          Guides and resources to help you understand glucose trends, sleep, activity, and more.
        </p>
      </header>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: ".5rem" }}>Getting Started</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>How continuous glucose data works</li>
          <li>Setting up Nightscout and connecting your account</li>
          <li>Understanding readings (mg/dL) and trend arrows</li>
        </ul>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: ".5rem" }}>Interpreting Your Data</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>Time in range: what it means and how to improve it</li>
          <li>Recognizing patterns: highs, lows, and variability</li>
          <li>Common causes of spikes and dips</li>
        </ul>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: ".5rem" }}>Best Practices</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>Logging meals, activity, and symptoms</li>
          <li>Creating gentle alerts that don’t overwhelm</li>
          <li>Sharing data with your care team</li>
        </ul>
      </section>

      <footer style={{ borderTop: "1px solid #eee", marginTop: "1.5rem", paddingTop: "1rem", color: "#666" }}>
        <small>
          Educational content is general information and not medical advice. Always follow your clinician’s guidance.
        </small>
      </footer>
    </main>
  );
}
