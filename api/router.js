// api/router.js
// ONE serverless function to handle all routes under /api/*

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

async function nightscoutTest(req, res) {
  const body = await readBody(req);
  const base = (body?.url || "").trim();
  const token = (body?.token || "").trim();
  const apiSecret = (body?.api_secret || "").trim();

  if (!base || !/^https?:\/\//i.test(base)) {
    return send(res, 400, { ok: false, error: "Valid Nightscout URL required" });
  }

  const headers = { "Accept": "application/json" };
  // Classic Nightscout expects sha1(API_SECRET) in the api-secret header
  if (apiSecret) {
    const sha1 = crypto.createHash("sha1").update(apiSecret).digest("hex");
    headers["api-secret"] = sha1;
  }

  // try two common endpoints
  const makeUrl = (path) => {
    const u = new URL(path, base.replace(/\/+$/, "/"));
    if (token) u.searchParams.set("token", token);
    u.searchParams.set("count", "1");
    return u.toString();
  };

  const endpoints = [
    makeUrl("/api/v1/entries/sgv.json"),
    makeUrl("/api/v1/entries.json"),
  ];

  for (const endpoint of endpoints) {
    try {
      const r = await fetch(endpoint, { headers });
      if (!r.ok) continue;
      const json = await r.json();
      const first = Array.isArray(json) ? json[0] : null;
      const sample = first?.sgv ?? first?.mbg ?? null;
      return send(res, 200, { ok: true, sample });
    } catch (e) {
      // try next
    }
  }

  return send(res, 200, { ok: false, error: "Could not reach Nightscout API with provided credentials" });
}

// ---------- shared setup ----------
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

// NOTE: this must be the service role key so we can read connection creds + insert readings.
const supabase = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE)
  : null;

function send(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).send(typeof body === "string" ? body : JSON.stringify(body));
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return null;
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({ raw: data });
      }
    });
    req.on("error", reject);
  });
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ===============================
// = Nightscout pull (CGM sync) =
// ===============================
// POST /api/cgm/nightscout/pull?user_id=UUID&sinceHours=24
// Pulls SGV entries from user's Nightscout and inserts to glucose_readings.
async function nightscoutPull(req, res) {
  try {
    if (!supabase) return send(res, 500, { ok: false, error: "Supabase not configured" });

    // allow POST with body or query
    const body = await readBody(req);
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const user_id = (body?.user_id || urlObj.searchParams.get("user_id") || "").trim();
    const sinceHoursStr = (body?.sinceHours || urlObj.searchParams.get("sinceHours") || "24").trim();
    const sinceHours = Math.max(1, Math.min(24 * 60, parseInt(sinceHoursStr, 10) || 24)); // clamp 1..1440

    if (!user_id) return send(res, 400, { ok: false, error: "Missing user_id" });

    // Look up user's Nightscout connection (url + token OR api_secret)
    const { data: conn, error: ce } = await supabase
      .from("nightscout_connections")
      .select("url, token, api_secret")
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ce) return send(res, 500, { ok: false, error: ce.message });
    if (!conn || !conn.url) {
      return send(res, 400, { ok: false, error: "No Nightscout connection for this user." });
    }

    let base = String(conn.url).trim();
    if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
    base = base.replace(/\/+$/, ""); // strip trailing slash

    // build query range
    const sinceISO = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();

    // Nightscout common endpoints for SGV:
    // - /api/v1/entries/sgv.json?find[dateString][$gte]=ISO&count=...
    // Fallback to /api/v1/entries.json if needed.
    const params = new URLSearchParams();
    params.set("count", "1000");
    params.set("find[dateString][$gte]", sinceISO);

    // Token support (Nightscout Pro or standard tokens)
    if (conn.token) params.set("token", conn.token);

    // Primary URL
    const sgvUrl = `${base}/api/v1/entries/sgv.json?${params.toString()}`;

    const headers = {};
    // API secret (Nightscout classic) expects SHA1 in 'api-secret' header
    if (conn.api_secret) {
      const sha1 = crypto.createHash("sha1").update(String(conn.api_secret)).digest("hex");
      headers["api-secret"] = sha1;
    }

    // Try SGV endpoint first
    let resp = await fetch(sgvUrl, { headers });
    let entries;
    if (resp.ok) {
      entries = await resp.json();
    } else {
      // fallback: generic entries endpoint
      const fallbackUrl = `${base}/api/v1/entries.json?${params.toString()}`;
      resp = await fetch(fallbackUrl, { headers });
      if (!resp.ok) {
        const text = await resp.text();
        return send(res, resp.status || 502, {
          ok: false,
          error: `Nightscout request failed (${resp.status})`,
          detail: text.slice(0, 300),
        });
      }
      entries = await resp.json();
    }

    if (!Array.isArray(entries)) entries = [];

    // Normalize to our glucose_readings schema
    const normalized = entries
      .map((e) => {
        // Nightscout fields commonly: sgv, date (ms), dateString (ISO), direction, type
        const mgdl = Number(e.sgv ?? e.glucose ?? e.mgdl);
        const ts =
          e.dateString ||
          (typeof e.date === "number" ? new Date(e.date).toISOString() : null) ||
          e.created_at ||
          e._id; // worst fallback
        if (!isFinite(mgdl) || !ts) return null;
        return {
          user_id,
          device_time: new Date(ts).toISOString(),
          value_mgdl: mgdl,
          trend: e.direction ?? null,
          source: "nightscout",
          note: null,
          created_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (!normalized.length) {
      return send(res, 200, { ok: true, pulled: 0, inserted: 0 });
    }

    // near the bottom of api/router.js, inside the export default handler:
export default async function handler(req, res) {
  const { method, url: rawUrl } = req;
  const url = new URL(rawUrl, `http://${req.headers.host}`);
  const path = url.pathname;

  // existing routes...

  if (path === "/api/ns-test" && method === "POST") return nightscoutTest(req, res);

  // 404 fallback...
  return send(res, 404, { ok: false, error: "Not found" });
}

    // De-dupe against what we already have (by exact device_time)
    const { data: existing, error: qe } = await supabase
      .from("glucose_readings")
      .select("device_time")
      .eq("user_id", user_id)
      .gte("device_time", sinceISO)
      .limit(5000);

    if (qe) return send(res, 500, { ok: false, error: qe.message });

    const have = new Set((existing || []).map((r) => new Date(r.device_time).toISOString()));
    const toInsert = normalized.filter((r) => !have.has(r.device_time));

    let inserted = 0;
    // Insert in chunks to be safe
    for (let i = 0; i < toInsert.length; i += 1000) {
      const chunk = toInsert.slice(i, i + 1000);
      const { error: ie } = await supabase.from("glucose_readings").insert(chunk);
      if (ie) {
        // If you add a unique index (user_id, device_time) you can swap this to .upsert({ onConflict: '...' })
        return send(res, 500, { ok: false, error: ie.message, inserted });
      }
      inserted += chunk.length;
    }

    return send(res, 200, { ok: true, pulled: normalized.length, inserted });
  } catch (e) {
    console.error(e);
    return send(res, 500, { ok: false, error: e.message || "Unknown Nightscout error" });
  }
}

// ---------------- example existing routes (kept minimal so nothing breaks) ---------------
async function healthIngest(req, res) {
  const body = await readBody(req);
  if (!supabase) return send(res, 500, { ok: false, error: "Supabase not configured" });
  const { user_id, source, type, start_time, end_time, value, unit, raw } = body || {};
  if (!user_id || !source || !type || !start_time) {
    return send(res, 400, { ok: false, error: "Missing required fields" });
  }
  const { error } = await supabase.from("health_readings").insert([{
    user_id, source, type, start_time, end_time: end_time ?? null,
    value: value ?? null, unit: unit ?? null, raw: raw ?? null
  }]);
  if (error) return send(res, 500, { ok: false, error: error.message });
  return send(res, 200, { ok: true });
}

async function exportHealthProvider(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const user_id = url.searchParams.get("user_id");
  if (!user_id) return send(res, 400, "Missing user_id");
  if (!supabase) return send(res, 500, "Supabase not configured");

  const { data, error } = await supabase
    .from("health_readings")
    .select("*")
    .eq("user_id", user_id)
    .order("start_time", { ascending: true })
    .limit(5000);

  if (error) return send(res, 500, "Query failed");

  const headers = ["id","user_id","source","type","start_time","end_time","value","unit"];
  const rows = (data || []).map(r => [
    r.id, r.user_id, r.source, r.type, r.start_time, r.end_time ?? "", r.value ?? "", r.unit ?? ""
  ]);
  const csv = [headers.join(","), ...rows.map(cols => cols.map(csvEscape).join(","))].join("\n");
  send(res, 200, csv, {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="health_export_${user_id}.csv"`
  });
}

// ---------------- main handler (router) ----------------
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  try {
    // NEW: Nightscout pull
    if (p === "/api/cgm/nightscout/pull") return await nightscoutPull(req, res);

    // Kept examples (feel free to extend)
    if (p === "/api/ingest") return await healthIngest(req, res);
    if (p === "/api/export/health.csv") return await exportHealthProvider(req, res);

    return send(res, 404, { ok: false, error: "Not found" });
  } catch (e) {
    console.error(e);
    return send(res, 500, { ok: false, error: e.message || "Internal error" });
  }
}
