// /api/cgm/nightscout/pull.js
// Nightscout → Supabase bridge (per-user, secure).
// - Auth: expects Authorization: Bearer <supabase_jwt>
// - Loads user's Nightscout URL/token from your encrypted vault (get_ns_conn)
// - Pulls recent SGVs and upserts into public.glucose_readings

import { createClient } from "@supabase/supabase-js";

function normalizeBaseUrl(raw) {
  if (!raw) return null;
  let url = String(raw).trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

export default async function handler(req, res) {
  try {
    // Method guard
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Auth guard
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization Bearer token" });
    }

    // Env (accept SUPABASE_* or VITE_SUPABASE_*)
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const NS_TOKEN_KEY = process.env.NS_TOKEN_KEY; // server-only

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[pull] Missing Supabase envs");
      return res.status(500).json({ error: "Supabase env not set" });
    }
    if (!NS_TOKEN_KEY) {
      console.error("[pull] Missing NS_TOKEN_KEY");
      return res.status(500).json({ error: "NS_TOKEN_KEY not set" });
    }

    // Supabase client acting AS the caller (so RLS applies)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    // Current user
    const { data: me, error: meErr } = await supabase.auth.getUser();
    if (meErr || !me?.user?.id) {
      console.error("[pull] auth.getUser failed", meErr);
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userId = me.user.id;

    // Provide decryption key to this session
    const { error: keyErr } = await supabase.rpc("set_app_key", {
      k: "app.ns_token_key",
      v: NS_TOKEN_KEY,
    });
    if (keyErr) {
      console.error("[pull] set_app_key error", keyErr);
      return res.status(500).json({ error: `set_app_key: ${keyErr.message}` });
    }

    // Load user's Nightscout connection (decrypted)
    const { data: connRows, error: connErr } = await supabase.rpc("get_ns_conn");
    if (connErr) {
      console.error("[pull] get_ns_conn error", connErr);
      return res.status(500).json({ error: `get_ns_conn: ${connErr.message}` });
    }
    const conn = connRows?.[0];
    if (!conn?.ns_url) {
      console.warn("[pull] no Nightscout connection row");
      return res.status(200).json({ inserted: 0, reason: "no-connection" });
    }

    const base = normalizeBaseUrl(conn.ns_url);
    if (!base) return res.status(400).json({ error: "Invalid Nightscout URL" });

    // Prefer Nightscout read token (query). Fallback to classic api-secret (sha1 hex) header if you stored SHA-1.
    const headers = { Accept: "application/json", "User-Agent": "sentinel-sync" };
    const entriesUrl = new URL(`${base}/api/v1/entries/sgv.json`);
    entriesUrl.searchParams.set("count", "1000");

    if (conn.token_read) {
      entriesUrl.searchParams.set("token", conn.token_read);
    } else if (conn.token_sha1) {
      headers["api-secret"] = String(conn.token_sha1).toLowerCase();
    }

    // Optional health check
    const statusResp = await fetch(`${base}/api/v1/status.json`, { headers });
    if (!statusResp.ok) {
      const detail = await statusResp.text().catch(() => "");
      console.error("[pull] status failed", statusResp.status, detail?.slice(0, 400));
      return res.status(502).json({ error: "Nightscout status failed", status: statusResp.status });
    }

    // Fetch entries
    const r = await fetch(entriesUrl.toString(), { headers });
    const raw = await r.text();
    if (!r.ok) {
      console.error("[pull] entries failed", r.status, raw?.slice(0, 400));
      return res.status(502).json({ error: "Nightscout entries failed", status: r.status });
    }

    let entries = [];
    try {
      const parsed = JSON.parse(raw);
      entries = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error("[pull] invalid JSON");
      return res.status(502).json({ error: "Invalid JSON from Nightscout" });
    }

    // Map to your schema
    const rows = entries
      .filter((e) => Number.isFinite(e?.sgv) && (e?.date || e?.dateString))
      .map((e) => {
        const iso =
          typeof e.dateString === "string" && e.dateString.includes("T")
            ? new Date(e.dateString).toISOString()
            : new Date(Number(e.date)).toISOString();

        return {
          user_id: userId,
          device_time: iso,
          value_mgdl: e.sgv,
          trend: e.direction ?? null,
          source: "nightscout",
          reading_type: null,
          note: null,
          timezone_offset_min: null,
          created_at: new Date().toISOString(),
        };
      });

    if (!rows.length) {
      console.warn("[pull] no rows to insert");
      return res.status(200).json({ inserted: 0, message: "No rows to insert." });
    }

    // Upsert into glucose_readings (requires unique index on user_id,device_time,source)
    const { error: upErr } = await supabase
      .from("glucose_readings")
      .upsert(rows, {
        onConflict: "user_id,device_time,source",
        ignoreDuplicates: true,
      });

    if (upErr) {
      console.error("[pull] upsert error", upErr);
      return res.status(500).json({ error: "Supabase upsert failed" });
    }

    return res.status(200).json({ inserted: rows.length });
  } catch (e) {
    console.error("[pull] exception", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}