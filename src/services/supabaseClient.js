// src/services/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// NEW: use a custom storage key so it never collides with any other client
const STORAGE_KEY = "sb-sentinel-auth-v1";

// Create exactly ONE browser client and reuse it across imports.
// We memoize on globalThis so code-splitting or multiple bundles won’t create duplicates.
function makeClient() {
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: STORAGE_KEY,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
    global: {
      headers: { "x-app-name": "sentinel-health" },
    },
  });
}

let supabase;

if (typeof window === "undefined") {
  // Server environment (SSR/tests): no persistent storage, no duplication
  supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  // Browser: reuse the memoized instance
  const g = globalThis;
  supabase = g.__SB_SENTINEL__ || (g.__SB_SENTINEL__ = makeClient());
}

export default supabase;