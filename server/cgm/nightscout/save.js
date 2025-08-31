// api/[...path].js
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

// ---- Supabase (server) ----
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

function send(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).send(typeof body === "string" ? body : JSON.stringify(body));
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
    });
    req.on("error", reject);
  });
}

// --- auth: extract user id from Authorization: Bearer <jwt> ---
function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4; if (pad) s += "=".repeat(4 - pad);
  return Buffer.from(s, "base64").toString("utf8");
}
function getUserIdFromReq(req) {
  const m = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const [, payload] = m[1].split(".");
    const obj = JSON.parse(b64urlDecode(payload));
    return obj.sub || obj.user_id || null;
  } catch { return null; }
}

// ================== Nightscout helpers ==================
function apiSecretHeader(secret) {
  if (!secret) return {};
  const sha1 = crypto.createHash("sha1").update(secret).digest("hex");
  return { "API-SECRET": sha1 };
}
function withToken(url, token) {
  if (!token) return url;
  const u = new URL(url);
  u.searchParams.set("token", token);
  return u.toString();
}

// ================== Route handlers ==================
async function nsSave(req, res) {
  if (!sb) return send(res, 500, { ok: false, error: "Supabase not configured" });

  const uid = getUserIdFromReq(req);
  if (!uid) return send(res, 401, { ok: false, error: "No auth" });

  const { url, token = null, api_secret = null } = await readBody(req);
  if (!url || !/^https?:\/\//i.test(url)) {
    return send(res, 400, { ok: false, error: "Valid Nightscout URL required" });
  }

  const row = { user_id: uid, url, token, api_secret, updated_at: new Date().toISOString() };
  const { error } = await sb.from("nightscout_connections").upsert(row, { onConflict: "user_id" });
  if (error) return send(res, 500, { ok: false, error: error.message });
  return send(res, 200, { ok: true });
}

async function nsTest(req, res) {
  const { url, token = null, api_secret = null } = await readBody(req);
  if (!url) return send(res, 400, { ok: false, error: "URL required" });

  const endpoint = withToken(`${url.replace(/\/+$/, "")}/api/v1/entries.json?count=1`, token);
  try {
    const r = await fetch(endpoint, { headers: { ...apiSecretHeader(api_secret) } });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok) {
      const text = await r.text();
      return send(res, 502, { ok: false, error: `Nightscout error ${r.status}: ${text.slice(0, 400)}` });
    }
    const data = ct.includes("application/json") ? await r.json() : [];
    const e = Array.isArray(data) && data[0] ? data[0] : null;
    const latest = e ? {
      sgv: e.sgv ?? e.mbgl ?? null,
      direction: e.direction ?? "-",
      date: e.dateString ?? e.date ?? null,
    } : null;
    return send(res, 200, { ok: true, latest });
  } catch (e) {
    return send(res, 502, { ok: false, error: String(e.message || e) });
  }
}

async function nsSync(req, res) {
  if (!sb) return send(res, 500, { ok: false, error: "Supabase not configured" });

  const uid = getUserIdFromReq(req);
  if (!uid) return send(res, 401, { ok: false, error: "No auth" });

  // Load saved conn for this user
  const { data: conn, error: ce } = await sb
    .from("nightscout_connections")
    .select("url, token, api_secret")
    .eq("user_id", uid)
    .maybeSingle();
  if (ce) return send(res, 500, { ok: false, error: ce.message });
  if (!conn?.url) return send(res, 400, { ok: false, error: "No saved Nightscout URL" });

  const { sinceDays = 14 } = await readBody(req);
  const sinceMs = Date.now() - sinceDays * 864e5;
  const endpoint = withToken(
    `${conn.url.replace(/\/+$/, "")}/api/v1/entries.json?find[date][$gte]=${sinceMs}&count=1000`,
    conn.token
  );

  try {
    const r = await fetch(endpoint, { headers: { ...apiSecretHeader(conn.api_secret) } });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok) {
      const text = await r.text();
      return send(res, 502, { ok: false, error: `Nightscout error ${r.status}: ${text.slice(0, 400)}` });
    }
    const entries = ct.includes("application/json") ? await r.json() : [];
    if (!Array.isArray(entries) || !entries.length) {
      return send(res, 200, { ok: true, inserted: 0 });
    }

    // Map to your glucose_readings schema
    const rows = entries.map((e) => ({
      user_id: uid,
      device_time: e.dateString ? new Date(e.dateString).toISOString() : new Date(e.date).toISOString(),
      value_mgdl: Number(e.sgv ?? e.mbgl ?? null),
      trend: e.direction ?? null,
      source: "nightscout",
      note: null,
      created_at: new Date().toISOString(),
    })).filter(r => Number.isFinite(r.value_mgdl));

    // Deduplicate by (user_id, device_time) if you have a unique index; otherwise insert as-is
    const { error: ie } = await sb.from("glucose_readings").insert(rows);
    if (ie) return send(res, 500, { ok: false, error: ie.message });

    return send(res, 200, { ok: true, inserted: rows.length });
  } catch (e) {
    return send(res, 502, { ok: false, error: String(e.message || e) });
  }
}

// ================== Main router ==================
export default async function handler(req, res) {
  // e.g. /api/nightscout/save -> "nightscout/save"
  const path = (req.url.split("?")[0] || "").replace(/^\/api\//, "");
  if (req.method === "OPTIONS") return send(res, 200, "ok");

  if (path === "nightscout/save" && req.method === "POST") return nsSave(req, res);
  if (path === "nightscout/test" && req.method === "POST") return nsTest(req, res);
  if (path === "nightscout/sync" && req.method === "POST") return nsSync(req, res);

  return send(res, 404, { ok: false, error: "Not found" });
}
