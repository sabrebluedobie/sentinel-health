// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Avoid printing secrets; just warn about missing config
  console.warn('Supabase env vars missing. Check Vercel project settings.');
}

// Use a unique storageKey so nothing else in the same origin collides
const options = {
  auth: {
    storageKey: 'sentinel-auth',     // <— important
    persistSession: true,
    autoRefreshToken: true,
    // Optional: if you don't use OAuth hash parsing on load:
    // detectSessionInUrl: false,
  },
};

// Vite HMR can re-run modules; keep exactly one instance on globalThis
const g = globalThis;
export const supabase =
  g.__sentinel_supabase__ || (g.__sentinel_supabase__ = createClient(url, anon, options));