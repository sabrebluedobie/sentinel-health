// src/auth/AuthGate.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * Prevents rapid duplicate navigations (Chrome "ipc flooding" protection).
 */
function useSafeNavigate() {
  const navigate = useNavigate();
  const lastRef = useRef<{ to: string; t: number }>({ to: "", t: 0 });

  return useCallback(
    (to: string, opts?: Parameters<typeof navigate>[1]) => {
      const now = Date.now();
      if (lastRef.current.to === to && now - lastRef.current.t < 800) return; // ignore spam
      lastRef.current = { to, t: now };
      if (location.pathname !== to) navigate(to, opts);
    },
    [navigate]
  );
}

export default function AuthGate({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<null | any>(null);
  const safeNavigate = useSafeNavigate();
  const loc = useLocation();

  // Load session once, and subscribe to changes.
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setReady(true);
      const sub = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
      unsub = () => sub.data.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  // Important: *only* redirect AFTER ready === true
  if (!ready) return null; // or a spinner

  // Example rules: /login is public, everything under /app needs auth.
  const isLogin = loc.pathname === "/login" || loc.pathname === "/signin";
  const needsAuth = loc.pathname.startsWith("/app");

  if (!session && needsAuth) {
    // go to login ONCE
    safeNavigate("/login", { replace: true });
    return null;
  }
  if (session && isLogin) {
    // already logged in -> app home (avoid ping-pong with login page)
    safeNavigate("/app", { replace: true });
    return null;
  }

  return children;
}
