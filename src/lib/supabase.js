import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (!url || !anon) {
  console.error("[Supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
} else {
  supabase = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

export default supabase;