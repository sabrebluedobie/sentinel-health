// /src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function withEntitlements(supabaseUser) {
  if (!supabaseUser) return null;

  // TEMP DEV GATE: allow only specific emails (replace with yours)
  const allowedEmails = [
    "mbrown0300@att.net",
    "melanie.brown@bluedobiedev.com",
  ];

  return {
    ...supabaseUser,
    hasInsightAccess: allowedEmails.includes(supabaseUser.email),
  };
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error("useAuth getSession error:", error);
      }

      setSession(data?.session || null);
      setUser(withEntitlements(data?.session?.user || null));
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      setUser(withEntitlements(newSession?.user || null));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}

export default useAuth;
