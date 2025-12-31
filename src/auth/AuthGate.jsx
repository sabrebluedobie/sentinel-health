import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createClient } from "@/lib/supabase";



function useSafeNavigate() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastRef = useRef({ to: "", t: 0 });

  return useCallback(
    (to, opts) => {
      const now = Date.now();
      if (lastRef.current.to === to && now - lastRef.current.t < 800) return;
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

  if (!ready) return null;

  const isSignIn = loc.pathname === "/sign-in";
  const needsAuth = !isSignIn && loc.pathname.startsWith("/app");

  if (!session && needsAuth) {
    safeNavigate("/sign-in", { replace: true });
    return null;
  }
  if (session && isSignIn) {
    safeNavigate("/app", { replace: true });
    return null;
  }

  return children;
}
