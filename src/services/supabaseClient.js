import { createClient } from "@supabase/supabase-js";
const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anon) console.warn("Missing VITE_SUPABASE_URL/ANON_KEY");
const supabase = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } });
export default supabase;