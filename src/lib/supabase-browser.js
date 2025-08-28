import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

const KEY = "__SB_CLIENT__";

if (!globalThis[KEY]) {
  if (!url || !anon) {
    console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (browser)");
    globalThis[KEY] = null;
  } else {
    globalThis[KEY] = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    console.info("INFO[Supabase] Client created once", new Date().toISOString());
  }
}

export const supabase = globalThis[KEY];
