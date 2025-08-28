import React, { useEffect, useState, useContext } from "react";
import "../styles/globals.css";
import { ThemeProvider } from "../components/ThemeContext";
import { AuthProvider, AuthContext } from "../components/AuthContext";
import Header from "../components/Header";
import Settings from "../components/Settings";
import SignIn from "../components/SignIn";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const [route, setRoute] = useState(window.location.hash || "#/");
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <Header />
      {loading ? (
        <div style={{ padding: 24 }}>Loading…</div>
      ) : route === "#/signin" ? (
        <SignIn />
      ) : route === "#/settings" ? (
        user ? <Settings /> : <SignIn />
      ) : (
        user ? <Home /> : <SignIn />
      )}
    </>
  );
}

function Home() {
  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1>Sentinel Health | Dashboard</h1>
      <p>Welcome back.</p>
    </div>
  );
}
