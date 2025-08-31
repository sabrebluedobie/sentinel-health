// src/pages/App.jsx
import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const { pathname } = useLocation();

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        textDecoration: "none",
        color: pathname === to ? "#111" : "#444",
        background: pathname === to ? "#e8e8e8" : "transparent",
      }}
    >
      {children}
    </Link>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
        }}
      >
        {/* Logo served from /public/logo.png */}
        <img
          src="/logo.png"
          alt="Sentinel Health"
          style={{ height: 32 }}
        />

        <nav style={{ display: "flex", gap: 8, marginLeft: 16 }}>
          <NavLink to="/app">Dashboard</NavLink>
          <NavLink to="/log-glucose">Glucose</NavLink>
          <NavLink to="/log-sleep">Sleep</NavLink>
          <NavLink to="/log-migraine">Migraine</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
          {/* you can inject user email/initials here later */}
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
