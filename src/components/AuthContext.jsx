import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabase";

const Ctx = createContext({ user: null, session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Hydrate from current session on first load
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        console.log('🔍 Checking for existing session...');
        const { data, error } = await supabase.auth.getSession();
        console.log('📦 Session data:', data);
        console.log('👤 User:', data?.session?.user);
        if (!mounted) return;
        if (error) console.warn("getSession error:", error);
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
      } finally {
        console.log('✅ Loading complete, loading=false');
        setLoading(false);
      }
    }
    bootstrap();

    // 2) Stay in sync with future auth changes (sign in/out, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('🔔 Auth state changed:', event, newSession?.user?.email || 'no user');
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Helpful helpers
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      // throws if not signed in—useful inside actions before writing to DB
      requireAuth() {
        if (!user) throw new Error("AUTH_REQUIRED");
        return user;
      },
    }),
    [user, session, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}