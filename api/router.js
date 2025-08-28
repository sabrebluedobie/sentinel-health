// ONE serverless function to handle all routes under /api/*

import { createClient } from "@supabase/supabase-js";

// ---------- shared setup ----------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only
const supabase = (SUPABASE_URL && SERVICE_ROLE) ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

function send(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).send(typeof body === "string" ? body : JSON.stringify(body));
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return null;
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
    });
    req.on("error", reject);
  });
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------- route handlers ----------
async function healthIngest(req, res) {
  const body = await readBody(req);
  const { user_id, source, type, start_time, end_time, value, unit, raw } = body || {};
  if (!supabase) return send(res, 500, { ok: false, error: "Supabase not configured" });
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

async function cgmConnect(req, res) {
  await readBody(req); // not used, but consume
  const CONNECT_URL = process.env.CGM_OAUTH_URL || "";
  if (CONNECT_URL) return send(res, 200, { url: CONNECT_URL });
  return send(res, 200, { message: "CGM connect not configured. Set CGM_OAUTH_URL in env." });
}

async function garminWebhook(req, res) {
  if (req.method === "GET") return send(res, 200, "ok"); // handshake
  const payload = await readBody(req);
  // TODO: verify signature when Garmin keys are issued
  // Optionally forward/normalize to ingest:
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
    // Insert directly to Supabase to avoid an extra HTTP hop
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
  // TODO: verify signature per Terra docs
  // Normalize & insert:
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

// ---------- main handler ----------
export default async function handler(req, res) {
  const { method,
