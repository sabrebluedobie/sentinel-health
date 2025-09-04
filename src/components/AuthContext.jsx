// src/components/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "@/lib/supabase";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: load current session once
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!supabase) {
          console.warn("[Auth] Supabase not configured");
          if (mounted) setLoading(false);
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setUser(data?.session?.user ?? null);
          setLoading(false);
        }
      } catch (e) {
        console.error("[Auth] getSession error", e);
        if (mounted) setLoading(false);
      }
    })();

    // Subscribe to auth changes
    const { data: sub } = supabase?.auth.onAuthStateChange?.((_, session) => {
      setUser(session?.user ?? null);
    }) ?? { data: null };

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = { user, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}