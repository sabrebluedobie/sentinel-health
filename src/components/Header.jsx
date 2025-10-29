// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.png";
const APP_NAME = import.meta.env.VITE_APP_NAME || "Sentinel Health";

export default function Header() {
  const { user } = useAuth();
  const nav = useNavigate();

  async function doSignOut() {
    await supabase.auth.signOut();
    nav("/sign-in", { replace: true });
  }

  return (
    <header className="site-header" style={styles.header}>
      <Link to="/" style={styles.brand}>
        <img src="/logo.png" alt="Logo" className="brand-logo" style={styles.logo} />
        <span style={styles.name}>{APP_NAME}</span>
      </Link>

      <nav style={styles.nav}>
        {user ? (
          <>
            <Link to="/settings" className="icon-btn" title="Settings" style={styles.iconBtn}>
              {/* simple gear glyph; replace with an icon lib if you like */}
              <span aria-hidden>⚙️</span><span className="sr-only">Settings</span>
            </Link>
            <button onClick={doSignOut} className="btn" style={styles.signout}>
              Sign out
            </button>
          </>
        ) : (
          <Link to="/sign-in" className="btn" style={styles.signin}>Sign in</Link>
        )}
        </nav>

        
      <nav style={{ display: "flex", gap: 12 }}>
        {/* other links */}
      <Link to="/settings">Settings</Link>


      </nav>
    </header>
  );
}

const styles = {
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 16px", borderBottom: "1px solid #eee" },
  brand: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" },
  logo: { height: 28, width: "auto" }, // keeps the logo small in the top-left
  name: { fontWeight: 700, fontSize: 16 },
  nav: { display: "flex", alignItems: "center", gap: 8 },
  iconBtn: { border: "1px solid #ddd", padding: "6px 10px", borderRadius: 10, background: "#fff", textDecoration: "none" },
  signin: { padding: "8px 12px", borderRadius: 8, border: "1px solid #1a73e8", background: "#1a73e8", color: "#fff", cursor: "pointer" },
  signout: { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
};
