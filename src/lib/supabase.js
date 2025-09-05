import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anon) throw new Error("Supabase env vars missing");

let supabase;
if (typeof window !== "undefined") {
  supabase = window.__sb ??= createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "sentinel-auth" }
  });
} else {
  supabase = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
}
export default supabase;