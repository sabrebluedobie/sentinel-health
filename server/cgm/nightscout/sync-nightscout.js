// api/sync-nightscout.js
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY; // server only

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

function sha1Hex(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function nsBase(u) {
  return String(u || "").replace(/\/+$/, ""); // trim trailing slash
}

// Vercel default export handler
export default async function handler(req, res) {
  try {
    if (!URL || !SRV) return send(res, 500, { ok: false, error: "Supabase not configured" });
    const supa = createClient(URL, SRV, { auth: { persistSession: false } });

    // Allow POST or GET. Inputs:
    // - user_id (required)
    // - lookback_days (optional, default 7)
    const isGET = req.method === "GET";
    const input = isGET ? req.query : (typeof req.body === "object" ? req.body : {});
    const user_id = input.user_id;
    const lookback_days = Math.max(1, Math.min(90, Number(input.lookback_days || 7)));

    if (!user_id) return send(res, 400, { ok: false, error: "Missing user_id" });

    // Pull saved connection
    const { data: conn, error: connErr } = await supa
      .from("nightscout_connections")
      .select("url, token, api_secret")
      .eq("user_id", user_id)
      .maybeSingle();

    if (connErr) return send(res, 500, { ok: false, error: `DB error: ${connErr.message}` });
    if (!conn?.url) return send(res, 404, { ok: false, error: "No Nightscout URL saved" });

    // Determine since: use last device_time we have (preferred), else lookback_days
    const { data: lastRow, error: lastErr } = await supa
      .from("glucose_readings")
      .select("device_time")
      .eq("user_id", user_id)
      .order("device_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sinceISO = new Date(Date.now() - lookback_days * 86400000).toISOString();
    if (!lastErr && lastRow?.device_time) {
      const lastT = new Date(lastRow.device_time).getTime();
      if (isFinite(lastT)) sinceISO = new Date(lastT - 5 * 60 * 1000).toISOString(); // small overlap
    }

    // Build Nightscout request
    const base = nsBase(conn.url);
    // Standard Nightscout: /api/v1/entries/sgv.json
    // Nightscout PRO mirrors this; token via query (?token=...), or header api-secret: sha1(secret)
    const params = new URLSearchParams();
    params.set("count", "1000");
    // filter by ISO string appears in 'dateString' — fallback if server ignores it
    params.set("find[dateString][$gte]", sinceISO);
    if (conn.token) params.set("token", conn.token);

    const headers = {};
    if (!conn.token && conn.api_secret) {
      headers["api-secret"] = sha1Hex(conn.api_secret);
    }

    const apiURL = `${base}/api/v1/entries/sgv.json?${params.toString()}`;
    const resp = await fetch(apiURL, { headers });
    const text = await resp.text();
    if (!resp.ok) {
      return send(res, 502, { ok: false, error: `Nightscout error ${resp.status}: ${text.slice(0, 280)}` });
    }

    let entries;
    try { entries = JSON.parse(text); } catch {
      return send(res, 502, { ok: false, error: `Nightscout non-JSON response: ${text.slice(0, 280)}` });
    }
    if (!Array.isArray(entries)) entries = [];

    // Map to rows for upsert
    const rows = entries
      .map(e => {
        // Nightscout supplies 'dateString' (ISO) and 'sgv' (mg/dL), 'trend' or 'direction'
        const iso = e.dateString || e.date || e._id /* worst case */;
        const v = Number(e.sgv);
        if (!iso || !isFinite(v)) return null;
        return {
          user_id,
          device_time: new Date(iso).toISOString(),
          value_mgdl: Math.round(v),
          trend: e.direction || e.trend || null,
          source: "nightscout",
          note: null,
        };
      })
      .filter(Boolean);

    if (!rows.length) return send(res, 200, { ok: true, imported: 0 });

    // Upsert by (user_id, device_time)
    const { error: upErr } = await supa
      .from("glucose_readings")
      .upsert(rows, { onConflict: "user_id,device_time", ignoreDuplicates: false });

    if (upErr) return send(res, 500, { ok: false, error: `Upsert error: ${upErr.message}` });

    return send(res, 200, { ok: true, imported: rows.length });
  } catch (e) {
    return send(res, 500, { ok: false, error: e?.message || String(e) });
  }
}
