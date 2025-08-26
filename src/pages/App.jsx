// src/pages/App.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/layout";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sentinel Health";
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && !session?.user) navigate("/sign-in", { replace: true });
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session?.user) navigate("/sign-in", { replace: true });
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, [navigate]);

  return (
    <>
      <Layout>
        <div className="space-y-4 p-6">
          <h2 className="text-2xl font-bold">Hello 👋</h2>
          <p>If you see this, Vite + React is working!</p>
        </div>
      </Layout>
      <Analytics />
      <SpeedInsights />
    </>
  );
}