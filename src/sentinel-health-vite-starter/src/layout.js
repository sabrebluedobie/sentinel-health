import React from "react";
export default function Layout({ children }){
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Sentinel Health | Migraine Tracker</h1>
        </header>
        {children}
      </div>
    </div>
  );
}