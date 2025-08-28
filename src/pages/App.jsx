import React, { useEffect, useState } from "react";
import "../styles/globals.css";
import { ThemeProvider } from "../components/ThemeContext";
import Header from "../components/Header";
import Settings from "../components/Settings";

export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <ThemeProvider>
      <Header />
      {route === "#/settings" ? <Settings /> : <Home />}
    </ThemeProvider>
  );
}

function Home() {
  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1>Welcome</h1>
      <p>Your dashboard goes here.</p>
    </div>
  );
}
