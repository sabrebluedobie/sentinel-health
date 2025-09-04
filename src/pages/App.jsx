// src/pages/App.jsx
import React from "react";
import { Link, Outlet, useLocation, Routes, Route } from "react-router-dom";
import SafeBoot from "@/pages/SafeBoot.jsx";
import Logo from "@/components/Logo.jsx";

export default function App() {
  const { pathname } = useLocation();

  const NavBtn = ({ to, children }) => (
    <Link
      to={to}
      className="btn"
      style={{
        textDecoration: "none",
        background: pathname === to ? "#f3f4f6" : "#fff",
        color: "#374151",
      }}
    >
      {children}
    </Link>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        className="card"
        style={{
          maxWidth: 1100,
          margin: "16px auto",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link to="/app" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}>
          <Logo size={40} />
          <div style={{ display: "grid", lineHeight: 1.1 }}>
            <strong style={{ fontSize: 16, color: "#111827" }}>Sentinel Health</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Migraine&nbsp;Tracker</span>
          </div>
        </Link>

        <nav style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <NavBtn to="/app">Dashboard</NavBtn>
          <NavBtn to="/log-glucose">Glucose</NavBtn>
          <NavBtn to="/log-sleep">Sleep</NavBtn>
          <NavBtn to="/log-migraine">Migraine</NavBtn>
          <NavBtn to="/settings">Settings</NavBtn>
          <NavBtn to="/app/education">Education</NavBtn>
        </nav>

        <div style={{ justifySelf: "end", fontSize: 12, color: "#9ca3af" }} />
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
