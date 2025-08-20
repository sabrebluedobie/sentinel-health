import React from "react";
import { Outlet, Link } from "react-router-dom";
import logoUrl from "../assets/logo.png"; // make sure file exists
import { Analytics } from "@vercel/analytics/next"

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Sentinel Health logo"
                 className="w-10 h-10 object-contain" />
            <span className="font-semibold text-brand-900">
              Sentinel Health | Migraine Tracker
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/log-migraine" className="text-sm text-brand-700 hover:text-brand-900">Log Migraine</Link>
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="container-page">
        <Outlet />
      </main>

      <footer className="mt-16 border-t py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Sentinel Health
      </footer>
    </div>
  );
}
