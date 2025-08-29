// api/nightscout/sync.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ---- server-side Supabase (SERVICE ROLE required) ----
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sadmin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE)
  : null;

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function nsHeaders(token, api_secret) {
  if (token) return {};
  if (api_secret) {
    return {
      "api-secret": crypto.createHash("sha1").update(String(api_secret)).digest("hex"),
    };
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "POST only" });
    return;
  }

  if (!sadmin) {
    res.status(500).json({ ok: false, error: "supabase not configured" });
    return;
  }

  try {
    const { url, token, api_secret, count = 200, user_id } = await readBody(req);

    // Resolve connection: prefer payload; otherwise load saved by user_id (if provided)
    let nsUrl = url?.trim();
    let nsToken = token || null;
    let nsSecret = api_secret || null;
    if (!nsUrl) {
      if (!user_id) throw new Error("Missing url and user_id");
      const { data, error } = await sadmin
        .from("nightscout_connections")
        .select("url, token, api_secret")
        .eq("user_id", user_id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.url) throw new Error("No saved Nightscout connection");
      nsUrl = data.url;
      nsToken = data.token || null;
      nsSecret = data.api_secret || null;
    }
    nsUrl = nsUrl.replace(/\/+$/, "");

    // Pull recent entries
    const params = new URLSearchParams({ count: String(count) });
    if (nsToken) params.set("token", nsToken);
    const endpoint = `${nsUrl}/api/v1/entries.json?${params.toString()}`;

    const r = await fetch(endpoint, { headers: nsHeaders(nsToken, nsSecret) });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Nightscout error ${r.status}: ${text || r.statusText}`);
    }
    const rows = await r.json();

    // Map to glucose_readings
    const toInsert = (rows || []).map((e) => ({
      user_id: user_id || null,          // you can pass user_id from client
      device_time: e.dateString || (e.date ? new Date(e.date).toISOString() : null),
      value_mgdl: e.sgv ?? e.mgdl ?? null,
      trend: e.direction ?? null,
      source: "nightscout",
      note: null,
      created_at: new Date().toISOString()
    })).filter(r => r.device_time && r.value_mgdl != null);

    // You may want a unique key on (user_id,device_time) to avoid duplicates.
    // Using insert for simplicity. Add .onConflict("user_id,device_time") if you created such a constraint.
    const { data: ins, error: insErr } = await sadmin
      .from("glucose_readings")
      .insert(toInsert);
    if (insErr) throw insErr;

    res.status(200).json({ ok: true, inserted: ins?.length || 0, skipped: (rows?.length || 0) - (ins?.length || 0) });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message || String(e) });
  }
}
