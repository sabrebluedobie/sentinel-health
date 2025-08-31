// src/auth/AuthGate.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Prevents rapid duplicate navigations (Chrome "ipc flooding" protection).
 * Only navigates when the target differs from the current path.
 */
function useSafeNavigate() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastRef = useRef({ to: "", t: 0 });

  return useCallback(
    (to, opts) => {
      const now = Date.now();
      if (lastRef.current.to === to && now - lastRef.current.t < 800) return; // ignore spam
      lastRef.current = { to, t: now };
      if (pathname !== to) navigate(to, opts);
    },
    [navigate, pathname]
  );
}

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const safeNavigate = useSafeNavigate();
  const loc = useLocation();

  // Load session once, subscribe to changes.
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setReady(true);
      const sub = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
      unsub = () => sub?.data?.subscription?.unsubscribe?.();
    })();
    return () => unsub();
  }, []);

  // Wait until auth status is known to avoid loops/flashes
  if (!ready) return null; // or a spinner component

  // Public route(s); everything else is considered protected
  const isSignIn = loc.pathname === "/sign-in";
  const needsAuth = !isSignIn && loc.pathname.startsWith("/app");

  if (!session && needsAuth) {
    // Not logged in -> go to sign-in (once)
    safeNavigate("/sign-in", { replace: true });
    return null;
  }

  if (session && isSignIn) {
    // Already logged in -> send to app home (once)
    safeNavigate("/app", { replace: true });
    return null;
  }

  return children;
}
