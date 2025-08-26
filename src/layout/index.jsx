// src/layout/index.jsx
import React from "react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-white text-gray-900">
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm px-6 py-4">
        <h1 className="text-xl font-bold">Sentinel Health</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

