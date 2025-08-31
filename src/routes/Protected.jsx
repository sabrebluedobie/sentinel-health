// src/routes/Protected.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import supabase from '@/lib/supabase';

export default function Protected({ children }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthed(!!session?.user);
      setChecked(true);
    })();
    return () => { mounted = false; };
  }, [location.pathname]);

  if (!checked) {
    return (
      <div style={{ padding: 24 }}>
        Loading…
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}