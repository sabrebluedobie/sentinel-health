// src/providers/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "@/lib/supabase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => mounted && setSession(data.session));
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  return <AuthCtx.Provider value={{ session }}>{children}</AuthCtx.Provider>;
}
