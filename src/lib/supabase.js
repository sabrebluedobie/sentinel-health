// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars missing. Check Vercel project settings.');
}

const options = {
  auth: {
    storageKey: 'sentinel-auth',  // unique storage key to avoid collisions
    persistSession: true,
    autoRefreshToken: true,
    // detectSessionInUrl: false,  // uncomment if you don't use OAuth hash parsing
  },
};

// Guard against Vite HMR creating more than one instance
const g = globalThis;
export const supabase =
  g.__sentinel_supabase__ || (g.__sentinel_supabase__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options));

export default supabase; // support both `import supabase ...` and `import { supabase } ...`

// Optional: quick instrumentation (remove later)
console.info('[Supabase] Client created once', new Date().toISOString());