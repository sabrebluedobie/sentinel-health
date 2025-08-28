// src/components/Header.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { AuthContext } from "./AuthContext";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Sentinel Health";
const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.png";

export default function Header() {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    nav("/signin");
  }

  return (
    <header className="header">
      <div className="container" style={{display:"flex",alignItems:"center",gap:12, padding:"10px 0"}}>
        <Link to="/" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none",color:"inherit"}}>
          <img src="/logo.png" alt="Logo" height="28" className='brand-logo' />
          <strong>{APP_NAME}</strong>
        </Link>
        <nav style={{marginLeft:"auto", display:"flex", gap:12}}>
          {user ? (
            <>
              <Link to="/" className="btn">Dashboard</Link>
              <Link to="/settings" className="btn">Settings</Link>
              <button className="btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn">Sign in</Link>
              <Link to="/signup" className="btn btn-primary">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
