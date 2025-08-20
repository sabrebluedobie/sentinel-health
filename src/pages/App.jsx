// src/App.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/layout";
import { supabase } from "../lib/supabase";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // On initial load, check if the user is signed in
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && !session?.user) {
        navigate("/sign-in", { replace: true });
      }
    })();

    // Keep listening for auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/sign-in", { replace: true });
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [navigate]);

  return (
    <Layout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Hello 👋</h2>
        <p>If you see this, Vite + React +
