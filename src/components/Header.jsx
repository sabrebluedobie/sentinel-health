// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Sentinel Health";
const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.png";

export default function Header() {
  const { user } = useAuth();
  const nav = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    nav("/signin", { replace: true });
  }

  return (
    <header
      className="header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          gap: 12,
        }}
      >
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <img
            src={LOGO_PATH}
            alt="Logo"
            style={{ height: 28, width: "auto", display: "block" }}
          />
          <strong>{APP_NAME}</strong>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <Link className="btn" to="/log-glucose">Log glucose</Link>
              <Link className="btn" to="/log-sleep">Log sleep</Link>
              <Link className="btn" to="/log-migraine">Log migraine</Link>
              <button className="btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link className="btn" to="/signin">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
