// src/pages/App.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Layout from "@/layout";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      // Only redirect once, and not if we're already on an auth page
      const onAuthPage =
        location.pathname === "/sign-in" ||
        location.pathname === "/login" ||
        location.pathname === "/sign-up";

      if (!session?.user && !redirectedRef.current && !onAuthPage) {
        redirectedRef.current = true;
        navigate("/sign-in", { replace: true });
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const onAuthPage =
        location.pathname === "/sign-in" ||
        location.pathname === "/login" ||
        location.pathname === "/sign-up";

      if (!session?.user && !redirectedRef.current && !onAuthPage) {
        redirectedRef.current = true;
        navigate("/sign-in", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, [navigate, location.pathname]);

  return (
    <>
      <Layout>
        {/* If you use nested routes, Outlet renders the child page. Otherwise it’s harmless. */}
        <Outlet />
      </Layout>
      <Analytics />
      <SpeedInsights />
    </>
  );
}