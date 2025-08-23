// /api/cgm/nightscout/pull.js
// Pulls recent entries from a Nightscout server and inserts into glucose_readings.

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-side only
);

function normalizeBaseUrl(raw) {
  if (!raw) return null;
  let url = raw.trim();
  // add protocol if missing
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  // remove trailing slash
  url = url.replace(/\/+$/, "");
  return url;
}

export default async function handler(req, res) {
  try {
    const { uid, url: rawUrl, token = "" } = req.query || {};
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    if (!rawUrl) return res.status(400).json({ error: "Missing url" });

    const base = normalizeBaseUrl(rawUrl);
    const entriesUrl = `${base}/api/v1/entries.json?count=100`;
    const statusUrl  = `${base}/api/v1/status.json`;

    // Some Nightscout setups require a SHA-1 hex of the API secret in the 'api-secret' header
    const headers = { "Accept": "application/json" };
    if (token) {
      const sha1 = crypto.createHash("sha1").update(token).digest("hex");
      headers["api-secret"] = sha1;
    }

    // Quick health check first
    const statusResp = await fetch(statusUrl, { headers });
    if (!statusResp.ok) {
      const text = await statusResp.text();
      return res.status(502).json({
        error: "Nightscout status failed",
        status: statusResp.status,
        details: text?.slice(0, 500) || "No details"
      });
    }

    // Fetch recent entries
    const r = await fetch(entriesUrl, { headers });
    const text = await r.text();
    if (!r.ok) {
      return res.status(502).json({
        error: "Nightscout entries failed",
        status: r.status,
        details: text?.slice(0, 800) || "No details"
      });
    }

    let entries;
    try { entries = JSON.parse(text); } catch {
      return res.status(502).json({ error: "Invalid JSON from Nightscout", sample: text?.slice(0, 200) });
    }

    const rows = (entries || []).map(e => ({
      user_id: uid,
      device_time: e.dateString || e.date, // prefer dateString; fallback to millis if provided
      reading_type: null,
      note: null,
      created_at: new Date().toISOString(),
      source: "nightscout",
      value_mgdl: e.sgv ?? null,
      trend: e.direction ?? null,
      timezone_offset_min: null
    })).filter(r => r.value_mgdl != null && r.device_time);

    if (!rows.length) {
      return res.status(200).json({ inserted: 0, message: "No rows to insert." });
    }

    // Upsert requires a unique index; see SQL below. If you don't add it yet,
    // you can change this to plain insert.
    const { error: upErr } = await supabase
      .from("glucose_readings")
      .upsert(rows, { onConflict: "user_id,device_time,source" });

    if (upErr) {
      return res.status(500).json({ error: "Supabase insert failed", details: upErr.message || upErr });
    }

    return res.status(200).json({ inserted: rows.length });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
