import { createClient } from "@supabase/supabase-js";
const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;
if (typeof window !== "undefined") {
  supabase = window.__sb ??= (url && anon ? createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null);
} else {
  supabase = url && anon ? createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null;
}
export default supabase;