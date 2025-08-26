import React, { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import NotFound from "@/pages/NotFound.jsx"; // if you don't have this, replace with Dashboard
import { supabase } from "@/lib/supabase";
import DebugOverlay from "@/components/debug/DebugOverlay.jsx";
export default function App() {
  const loc = useLocation();
<div style={{ background: "#fff", border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: 12 }}>
  Hello from App.jsx — if you can read this, the Router & render pipeline are fine.
</div>
  useEffect(() => {
    document.title = "Sentinel Health";
  }, []);

  // avoid replaceState loops: do NOT navigate inside render;
  // we only gate routes declaratively below.
  function Protected({ children }) {
    const [ok, setOk] = React.useState(null);
    useEffect(() => {
      let alive = true;
      (async () => {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setOk(!!data?.session?.user);
      })();
      return () => { alive = false; };
    }, [loc.key]);
    if (ok === null) return <div style={{ padding:16 }}>Loading…</div>;
    return ok ? children : <Navigate to="/sign-in" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}