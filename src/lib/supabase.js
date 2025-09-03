import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url)  throw new Error('Missing VITE_SUPABASE_URL');
if (!anon) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

// Browser-safe singleton (prevents HMR duplicates)
let client = globalThis.__sbClient;
if (!client) {
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
  globalThis.__sbClient = client;
}

export default client;