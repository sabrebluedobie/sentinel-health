// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn('Supabase env vars missing. Check Vercel project settings.');
}

const options = {
  auth: {
    storageKey: 'sentinel-auth',
    persistSession: true,
    autoRefreshToken: true,
    // detectSessionInUrl: false, // uncomment if you don't use OAuth hash parsing
  },
};

// Keep a single instance across HMR
const g = globalThis;
export const supabase =
  g.__sentinel_supabase__ || (g.__sentinel_supabase__ = createClient(url, anon, options));

// Export default **and** named
export default supabase;
