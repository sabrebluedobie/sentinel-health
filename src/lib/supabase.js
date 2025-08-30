// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// Single client instance in-browser (avoids multiple clients during HMR)
const _client = (() => {
  if (typeof window !== "undefined") {
    const g = window;
    if (g.__sentinel_supabase__) return g.__sentinel_supabase__;
    g.__sentinel_supabase__ = createClient(url, anon);
    return g.__sentinel_supabase__;
  }
  return createClient(url, anon);
})();

export const supabase = _client; // <-- named export
export default _client;          // <-- default export
