// src/services/cgm.js
// Client helpers for CGM connections

import supabase from "./supabaseClient.js";

// Map connections to { provider: true/false }
export async function getConnections(userId) {
  if (!userId) return {};
  const { data, error } = await supabase
    .from("cgm_connections")
    .select("provider,status")
    .eq("user_id", userId);
  if (error) return {};
  const map = {};
  (data || []).forEach(r => { map[r.provider] = r.status === "active"; });
  return map;
}

// Save/update Nightscout connection row
export async function upsertNightscout(userId, url, token) {
  // store in cgm_connections; optionally keep token in a separate table if you prefer
  const { error } = await supabase
    .from("cgm_connections")
    .upsert({ user_id: userId, provider: "nightscout", status: "active", url, token }, { onConflict: "user_id,provider" });
  if (error) throw error;
  return true;
}

// Trigger serverless pull (ingests to glucose_readings)
export async function pullNightscoutNow(userId, url, token) {
  const qs = new URLSearchParams({
    uid: userId,
    url,                     // server will normalize protocol/trailing slash
    token: token || ""
  });
  const res = await fetch(`/api/cgm/nightscout/pull?${qs.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Nightscout pull failed (${res.status}): ${body?.error || "Unknown"}${body?.details ? " — " + String(body.details).slice(0,200) : ""}`);
  }
  return body; // { inserted, ... }
}

// Dexcom OAuth start (redirect)
export function startDexcomOAuth(userId) {
  const state = ""; // optionally encode return path
  window.location.href = `/api/cgm/dexcom/start?uid=${encodeURIComponent(userId)}&state=${encodeURIComponent(state)}`;
}

// Disconnect (removes connection + any tokens)
export async function disconnectProvider(userId, provider) {
  // remove cgm_connections row
  await supabase.from("cgm_connections").delete().eq("user_id", userId).eq("provider", provider);
  // remove tokens if present
  await supabase.from("oauth_tokens").delete().eq("user_id", userId).eq("provider", provider);
}
