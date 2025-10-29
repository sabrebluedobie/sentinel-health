// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { supabase } from '@/lib/supabase'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-2">404 – Not Found</h1>
        <p className="text-slate-600 mb-4">That page doesn’t exist.</p>
        <Link to="/" className="text-brand-700 underline">Back to Dashboard</Link>
      </div>
    </div>
  );
}
