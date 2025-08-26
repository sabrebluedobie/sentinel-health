// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error("VITE_SUPABASE_URL is missing");
if (!SUPABASE_ANON_KEY) throw new Error("VITE_SUPABASE_ANON_KEY is missing");

let _supabase = globalThis.__sbClient;
if (!_supabase) {
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  globalThis.__sbClient = _supabase;
  console.info("INFO[Supabase] Client created once", new Date().toISOString());
}
const supabase = _supabase;

export { supabase };
export default supabase;