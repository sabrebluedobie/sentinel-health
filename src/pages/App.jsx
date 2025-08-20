// src/App.jsx
import React from "react";
import Layout from "@/layout";
import { supabase } from "../lib/supabase";

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

const email = user?.email;

export default function App() {
  return (
    <Layout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Hello 👋</h2>
        <p>If you see this, Vite + React + Tailwind are wired correctly.</p>
      </div>
    </Layout>
  );
}
