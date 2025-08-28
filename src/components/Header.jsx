"use client";
import React from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase-browser";

export default function Header() {
  const onLogout = async () => {
    try {
      await supabase?.auth?.signOut?.();
      // Optionally hard-refresh to clear client state
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("Logout failed");
    }
  };

  return (
    <header style={styles.bar}>
      <div style={styles.left}>
        <img src="/logo.svg" alt="Logo" style={styles.logo} />
        <Link href="/" style={styles.brand}>Your App</Link>
      </div>
      <nav style={styles.right}>
        <Link href="/settings" style={styles.link}>Settings</Link>
        <button onClick={onLogout} style={styles.button}>Log out</button>
      </nav>
    </header>
  );
}

const styles = {
  bar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff", zIndex: 10 },
  left: { display: "flex", alignItems: "center", gap: 10 },
  right: { display: "flex", alignItems: "center", gap: 12 },
  logo: { height: 28, width: "auto" },
  brand: { fontWeight: 600, textDecoration: "none", color: "#111" },
  link: { textDecoration: "none", color: "#333" },
  button: { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa", cursor: "pointer" }
};
