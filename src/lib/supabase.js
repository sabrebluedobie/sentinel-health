// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // You’ll see this locally if env vars are missing
  console.warn("[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

const client = (() => {
  if (typeof window !== "undefined") {
    // Reuse a single instance across HMR/page reloads
    if (!window.__supabase_client__) {
      window.__supabase_client__ = createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    }
    return window.__supabase_client__;
  }
  return createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
})();

export const supabase = client;   // named
export default client;            // default
