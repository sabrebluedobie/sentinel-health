// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Prefer Vite's env; fall back to NEXT_PUBLIC_* if present
const url  = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton guard to avoid multiple GoTrue clients in the same tab
const KEY = "__SB_CLIENT__";

if (!globalThis[KEY]) {
  if (!url || !anon) {
    console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (browser)");
    globalThis[KEY] = null;
  } else {
    globalThis[KEY] = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    console.info("INFO[Supabase] Client created once", new Date().toISOString());
  }
}

const supabase = globalThis[KEY];
export default supabase;
