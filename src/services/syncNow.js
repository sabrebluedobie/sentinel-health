// src/services/syncNow.js
import supabase from "./supabaseClient";

export async function syncNightscoutNow() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const r = await fetch("/api/cgm/nightscout/pull", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  let out = null;
  try {
    out = await r.json();
  } catch {
    out = { error: `HTTP ${r.status}` };
  }

  if (!r.ok) {
    return { error: out?.error || `HTTP ${r.status}` };
  }
  return out;
}