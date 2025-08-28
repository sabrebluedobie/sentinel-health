// src/components/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../lib/supabase";

export const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsub = () => {};

    async function init() {
      if (!supabase) {
        console.error("[Auth] Supabase client is null — check env vars");
        if (mounted) setLoading(false);
        return;
      }

      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session || null);
      setUser(session?.user || null);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess || null);
        setUser(sess?.user || null);
      });
      unsub = () => subscription?.unsubscribe?.();
    }

    init();
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const value = { session, user, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Provide a default export too (some files may import default)
export default AuthProvider;
