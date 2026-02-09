// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client with anon key (for frontend)
// IMPORTANT: Ensure session persistence through OAuth redirects
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store session in localStorage so it persists through redirects
    persistSession: true,
    // Automatically refresh tokens
    autoRefreshToken: true,
    // Detect session from URL on page load (important for OAuth callbacks)
    detectSessionInUrl: true,
    // Use localStorage (default, but being explicit)
    storage: window.localStorage,
    // Where to redirect after OAuth (if needed)
    // flowType: 'pkce', // Use PKCE flow for better security
  },
});