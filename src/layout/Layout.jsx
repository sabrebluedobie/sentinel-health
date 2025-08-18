import React from "react";
import { Link, Outlet } from "react-router-dom";
import logo from "../../src/assets/logo.png"; // place file at src/assets/sentinel-logo.png

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200">
  <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
    <img
      src={logo}
      alt="Sentinel Health"
      className="h-[100px] w-[100px] object-contain"
      style={{
        width: "100px", height: "100px", top: "5vh", left: "5vw",
        position: "absolute",
        marginBottom: "5vh",
      }}
    />
    <div style={{ paddingTop: "120px" }} className="flex flex-col">
      <span className="text-xl font-semibold text-brand-900 leading-tight">
        Sentinel Health
      </span>
      <span className="text-sm text-slate-500 -mt-0.5">Migraine Tracker</span>
    </div>
    <nav className="ml-auto flex items-center gap-3">
      <Link className="link" to="/dashboard">Dashboard</Link>
      <Link className="link" to="/log-migraine">Log Migraine</Link>
    </nav>
  </div>
</header>

      {/* Background accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-100 via-white to-white"
      />

      {/* Page content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-slate-500">
          © {new Date().getFullYear()} Sentinel Health
        </div>
      </footer>
    </div>
  );
}
