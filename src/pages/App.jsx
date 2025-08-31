import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const { pathname } = useLocation();

  const NavBtn = ({ to, children }) => (
    <Link
      to={to}
      className="btn"
      style={{
        textDecoration: "none",
        background: pathname === to ? "#e8e8e8" : "#fff",
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
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <img src="/logo.png" alt="Sentinel Health" className="logo" style={{ margin: 0, width: 40, height: 40 }} />
        <nav style={{ display: "flex", gap: 8 }}>
          <NavBtn to="/app">Dashboard</NavBtn>
          <NavBtn to="/log-glucose">Glucose</NavBtn>
          <NavBtn to="/log-sleep">Sleep</NavBtn>
          <NavBtn to="/log-migraine">Migraine</NavBtn>
          <NavBtn to="/settings">Settings</NavBtn>
        </nav>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }} />
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
