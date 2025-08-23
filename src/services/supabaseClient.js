// src/services/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// One storage key for your app. Changing this avoids clashes with any other clients.
const storageKey = "sb-sentinel-auth";

const browserOpts = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  global: {
    headers: { "x-app-name": "sentinel-health" },
  },
};

// Ensure exactly ONE client instance in the browser.
// (Avoids “Multiple GoTrueClient instances detected…”)
let client;

if (typeof window !== "undefined") {
  // Reuse a memoized instance attached to window
  client = window.__supabase ?? (window.__supabase = createClient(url, anon, browserOpts));
} else {
  // Server-side (e.g., SSR, tests) — no persisted session needed
  client = createClient(url, anon, { auth: { persistSession: false } });
}

export default client;