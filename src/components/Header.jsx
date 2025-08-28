import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContext";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Sentinel Health";
const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.svg";

export default function Header() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await supabase?.auth?.signOut?.();
      navigate("/signin", { replace: true });
    } catch (e) {
      console.error(e);
      alert("Logout failed");
    }
  };

  return (
    <header style={styles.bar}>
      <div style={styles.left}>
        <img src={LOGO_PATH} alt="Logo" style={styles.logo} />
        <Link to="/" style={styles.brand}>{APP_NAME}</Link>
      </div>
      <nav style={styles.right}>
        {user ? (
          <>
            <Link to="/settings" style={styles.link}>Settings</Link>
            <button onClick={onLogout} style={styles.button}>Log out</button>
          </>
        ) : (
          <Link to="/signin" style={styles.link}>Sign in</Link>
        )}
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
