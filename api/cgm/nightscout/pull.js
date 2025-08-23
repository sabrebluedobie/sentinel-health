// /api/cgm/nightscout/pull.js
// Pull recent Nightscout entries for the signed-in user and upsert into glucose_readings.

import { createClient } from "@supabase/supabase-js";

// Normalize & sanitize a Nightscout base URL
function normalizeBaseUrl(raw) {
  if (!raw) return null;
  let url = String(raw).trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ---- 1) Auth: require a user session (Bearer <jwt>) ----
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization Bearer token" });
    }

    // ---- 2) Supabase client acting AS THE USER ----
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return res.status(500).json({ error: "Supabase env not set (VITE_SUPABASE_URL/ANON_KEY)" });
    }
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: auth } },
    });

    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user?.id) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userId = userResp.user.id;

    // ---- 3) Provide encryption key this request can use to decrypt tokens ----
    const nsKey = process.env.NS_TOKEN_KEY;
    if (!nsKey) {
      return res.status(500).json({ error: "NS_TOKEN_KEY not set in server env" });
    }
    await supabase.rpc("set_app_key", { k: "app.ns_token_key", v: nsKey });

    // ---- 4) Get the user's Nightscout connection (decrypted) ----
    const { data: connRows, error: connErr } = await supabase.rpc("get_ns_conn");
    if (connErr) return res.status(500).json({ error: `get_ns_conn: ${connErr.message}` });

    const conn = connRows?.[0];
    if (!conn?.ns_url) {
      return res.status(200).json({ inserted: 0, reason: "no-connection" });
    }

    const base = normalizeBaseUrl(conn.ns_url);
    if (!base) return res.status(400).json({ error: "Invalid Nightscout URL" });

    // Prefer Nightscout READ token (query param). Fallback to classic api-secret (sha1 header) if present.
    const u = new URL(`${base}/api/v1/entries/sgv.json`);
    u.searchParams.set("count", "1000"); // pull a decent window

    const headers = { Accept: "application/json", "User-Agent": "sentinel-sync" };

    if (conn.token_read) {
      // Nightscout Read Token (preferred)
      u.searchParams.set("token", conn.token_read);
    } else if (conn.token_sha1) {
      // Classic api-secret value EXPECTED AS SHA-1 HEX in header
      headers["api-secret"] = conn.token_sha1.toLowerCase();
    }

    // ---- 5) Optional status check (nice-to-have) ----
    const statusUrl = `${base}/api/v1/status.json`;
    const statusResp = await fetch(statusUrl, { headers });
    if (!statusResp.ok) {
      const detail = await statusResp.text().catch(() => "");
      return res.status(502).json({
        error: "Nightscout status failed",
        status: statusResp.status,
        details: detail?.slice(0, 400) || "No details",
      });
    }

    // ---- 6) Fetch entries ----
    const r = await fetch(u.toString(), { headers });
    const raw = await r.text();
    if (!r.ok) {
      return res.status(502).json({
        error: "Nightscout entries failed",
        status: r.status,
        details: raw?.slice(0, 800) || "No details",
      });
    }

    let entries = [];
    try {
      entries = JSON.parse(raw);
      if (!Array.isArray(entries)) entries = [];
    } catch {
      return res.status(502).json({ error: "Invalid JSON from Nightscout", sample: raw?.slice(0, 200) });
    }

    // ---- 7) Map to your schema ----
    // Nightscout SGV items typically have: { sgv, date (millis), dateString (ISO), direction, ... }
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
          note: null,
          reading_type: null,
          timezone_offset_min: null,
          created_at: new Date().toISOString(),
        };
      });

    if (!rows.length) {
      return res.status(200).json({ inserted: 0, message: "No rows to insert." });
    }

    // ---- 8) Upsert into glucose_readings ----
    // Make sure you have a unique index: (user_id, device_time, source)
    //   create unique index if not exists glucose_uid_time_src_uq
    //   on public.glucose_readings (user_id, device_time, source);
    const { error: upErr } = await supabase
      .from("glucose_readings")
      .upsert(rows, {
        onConflict: "user_id,device_time,source",
        ignoreDuplicates: true,
      });

    if (upErr) {
      return res.status(500).json({ error: "Supabase upsert failed", details: upErr.message || upErr });
    }

    return res.status(200).json({ inserted: rows.length });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}