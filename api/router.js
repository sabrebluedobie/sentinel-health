// ONE serverless function to handle all routes under /api/*
// Place this at: api/router.js

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ---------- shared setup ----------
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only
const supabase = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE)
  : null;

function send(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res
    .status(status)
    .send(typeof body === "string" ? body : JSON.stringify(body));
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

async function getUserFromAuthHeader(req) {
  const auth = req.headers["authorization"] || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

// ---------- route handlers ----------
async function healthIngest(req, res) {
  const body = await readBody(req);
  const { user_id, source, type, start_time, end_time, value, unit, raw } =
    body || {};
  if (!supabase) return send(res, 500, { ok: false, error: "Supabase not configured" });
  if (!user_id || !source || !type || !start_time) {
    return send(res, 400, { ok: false, error: "Missing required fields" });
  }
  const { error } = await supabase.from("health_readings").insert([
    {
      user_id,
      source,
      type,
      start_time,
      end_time: end_time ?? null,
      value: value ?? null,
      unit: unit ?? null,
      raw: raw ?? null,
    },
  ]);
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

  const headers = [
    "id",
    "user_id",
    "source",
    "type",
    "start_time",
    "end_time",
    "value",
    "unit",
  ];
  const rows = (data || []).map((r) => [
    r.id,
    r.user_id,
    r.source,
    r.type,
    r.start_time,
    r.end_time ?? "",
    r.value ?? "",
    r.unit ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map((cols) => cols.map(csvEscape).join(","))].join("\n");
  send(res, 200, csv, {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="health_export_${user_id}.csv"`,
  });
}

async function cgmConnect(_req, res) {
  const CONNECT_URL = process.env.CGM_OAUTH_URL || "";
  if (CONNECT_URL) return send(res, 200, { url: CONNECT_URL });
  return send(res, 200, {
    message: "CGM connect not configured. Set CGM_OAUTH_URL in env.",
  });
}

async function garminWebhook(req, res) {
  if (req.method === "GET") return send(res, 200, "ok"); // handshake
  const payload = await readBody(req);
  try {
    const normalized = {
      user_id: payload?.userId || "unknown",
      source: "garmin",
      type: payload?.type || "unknown",
      start_time: payload?.startTime || new Date().toISOString(),
      end_time: payload?.endTime || null,
      value: payload?.value ?? null,
      unit: payload?.unit || null,
      raw: payload,
    };
    if (!supabase) return send(res, 500, { ok: false, error: "Supabase not configured" });
    const { error } = await supabase.from("health_readings").insert([normalized]);
    if (error) throw error;
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    return send(res, 500, { ok: false });
  }
}

async function terraWebhook(req, res) {
  const payload = await readBody(req);
  if (!supabase) return send(res, 500, { ok: false, error: "Supabase not configured" });
  const norm = {
    user_id: payload?.user?.user_id || "unknown",
    source: "terra",
    type: payload?.type || "unknown",
    start_time: payload?.start_time || new Date().toISOString(),
    end_time: payload?.end_time || null,
    value: payload?.value ?? null,
    unit: payload?.unit || null,
    raw: payload,
  };
  const { error } = await supabase.from("health_readings").insert([norm]);
  if (error) return send(res, 500, { ok: false, error: error.message });
  return send(res, 200, { ok: true });
}

// ---- Nightscout: manual pull (button in Settings calls this) ----
async function nightscoutPull(req, res) {
  if (req.method !== "POST")
    return send(res, 405, { ok: false, error: "Use POST" });

  if (!supabase)
    return send(res, 500, { ok: false, error: "Supabase not configured" });

  const user = await getUserFromAuthHeader(req);
  if (!user) return send(res, 401, { ok: false, error: "Not authenticated" });

  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const days = Math.max(1, parseInt(urlObj.searchParams.get("days") || "3", 10));
  const count = Math.max(1, parseInt(urlObj.searchParams.get("count") || "1000", 10));
  const sinceISO = new Date(Date.now() - days * 86400000).toISOString();

  // Load user's Nightscout connection
  const { data: conn, error: ce } = await supabase
    .from("nightscout_connections")
    .select("url, token, api_secret")
    .eq("user_id", user.id)
    .single();

  if (ce) return send(res, 500, { ok: false, error: ce.message });
  if (!conn?.url) return send(res, 400, { ok: false, error: "Nightscout not configured" });

  const base = conn.url.replace(/\/+$/, "");
  const params = new URLSearchParams();
  params.set("find[dateString][$gte]", sinceISO);
  params.set("count", String(count));
  if (conn.token) params.set("token", conn.token);

  const fetchUrl = `${base}/api/v1/entries/sgv.json?${params.toString()}`;

  const headers = {};
  if (conn.api_secret) {
    // Nightscout expects SHA1 hex of the api_secret in 'api-secret' header
    headers["api-secret"] = crypto.createHash("sha1").update(conn.api_secret).digest("hex");
  }

  // Fetch from Nightscout
  let entries = [];
  try {
    const r = await fetch(fetchUrl, { headers });
    if (!r.ok) throw new Error(`Nightscout HTTP ${r.status}`);
    entries = await r.json();
    if (!Array.isArray(entries)) entries = [];
  } catch (e) {
    return send(res, 502, { ok: false, error: e.message });
  }

  // Map to glucose_readings rows
  const nowISO = new Date().toISOString();
  const rows = entries
    .map((e) => {
      const device_time =
        e?.dateString ??
        (e?.date ? new Date(e.date).toISOString() : null);
      const value = Number(e?.sgv);
      if (!device_time || !isFinite(value)) return null;
      return {
        user_id: user.id,
        device_time,
        value_mgdl: value,
        trend: e?.direction ?? null,
        source: "nightscout",
        note: null,
        created_at: nowISO,
      };
    })
    .filter(Boolean);

  // De-dupe against what's already in the DB for this window
  const { data: existing, error: ee } = await supabase
    .from("glucose_readings")
    .select("device_time")
    .eq("user_id", user.id)
    .gte("device_time", sinceISO)
    .limit(5000);

  if (ee) return send(res, 500, { ok: false, error: ee.message });

  const seen = new Set((existing || []).map((r) => new Date(r.device_time).toISOString()));
  const toInsert = rows.filter((r) => !seen.has(new Date(r.device_time).toISOString()));

  let inserted = 0;
  if (toInsert.length) {
    const { data: ins, error: ie } = await supabase
      .from("glucose_readings")
      .insert(toInsert);
    if (ie) return send(res, 500, { ok: false, error: ie.message, fetched: rows.length, filtered: toInsert.length });
    inserted = ins?.length ?? toInsert.length;
  }

  return send(res, 200, {
    ok: true,
    fetched: rows.length,
    inserted,
    skipped: rows.length - inserted,
  });
}

// ---------- main handler ----------
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === "/api/health/ingest") return healthIngest(req, res);
    if (path === "/api/export/health") return exportHealthProvider(req, res);
    if (path === "/api/cgm/connect") return cgmConnect(req, res);
    if (path === "/api/webhook/garmin") return garminWebhook(req, res);
    if (path === "/api/webhook/terra") return terraWebhook(req, res);
    if (path === "/api/nightscout/pull") return nightscoutPull(req, res);

    return send(res, 404, { ok: false, error: "Not found" });
  } catch (e) {
    console.error(e);
    return send(res, 500, { ok: false, error: "Server error" });
  }
}
