// api/router.js
// ONE serverless function to handle all routes under /api/*

import { createClient } from "@supabase/supabase-js";

/** -------------------------
 *  Supabase (server) client
 *  -------------------------
 *  Reads URL from any of these (first match wins), and SERVICE ROLE for writes.
 *  Make sure these envs exist in Vercel:
 *   - VITE_SUPABASE_URL (or SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY   (server-only)
 */
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only, never expose to client

const supabase =
  SUPABASE_URL && SERVICE_ROLE
    ? createClient(SUPABASE_URL, SERVICE_ROLE, {
        auth: { persistSession: false },
      })
    : null;

/** -------------------------
 *  Helpers
 *  ------------------------- */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
}

function send(res, status, body, headers = {}) {
  cors(res);
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  const isString = typeof body === "string";
  if (!isString && !headers["Content-Type"]) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  res.status(status).send(isString ? body : JSON.stringify(body));
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS")
    return null;
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

/** -------------------------
 *  Route Handlers
 *  ------------------------- */
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
  // Read user_id from query string
  const u = new URL(
    req.headers["x-vercel-original-url"] || req.url,
    `http://${req.headers.host}`
  );
  const user_id = u.searchParams.get("user_id");
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
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="health_export_${user_id}.csv"`,
  });
}

async function cgmConnect(req, res) {
  await readBody(req); // consume if any
  const CONNECT_URL = process.env.CGM_OAUTH_URL || "";
  if (CONNECT_URL) return send(res, 200, { url: CONNECT_URL });
  return send(res, 200, {
    message:
      "CGM connect not configured. Set CGM_OAUTH_URL in environment variables.",
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

/** -------------------------
 *  Main handler / router
 *  ------------------------- */
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return send(res, 200, "ok");

  // Derive the original path robustly (works with Vercel rewrites)
  const originalUrl = req.headers["x-vercel-original-url"] || req.url;
  const u = new URL(originalUrl, `http://${req.headers.host}`);
  const pathname = u.pathname; // e.g., /api/health/ingest

  // Normalize: strip leading /api (if present) so we can switch on the remainder
  const subpath = pathname.replace(/^\/api\/?/, "/"); // e.g., /health/ingest

  try {
    // Health ingest: POST /api/health/ingest
    if (req.method === "POST" && subpath === "/health/ingest") {
      return await healthIngest(req, res);
    }

    // Export CSV: GET /api/health/export?user_id=...
    if (req.method === "GET" && subpath === "/health/export") {
      return await exportHealthProvider(req, res);
    }

    // CGM connect helper: GET /api/cgm/connect
    if (req.method === "GET" && subpath === "/cgm/connect") {
      return await cgmConnect(req, res);
    }

    // Garmin webhook: GET (handshake) or POST /api/garmin/webhook
    if (subpath === "/garmin/webhook" && (req.method === "GET" || req.method === "POST")) {
      return await garminWebhook(req, res);
    }

    // Terra webhook: POST /api/terra/webhook
    if (req.method === "POST" && subpath === "/terra/webhook") {
      return await terraWebhook(req, res);
    }

    // Root or unknown: show help
    if (subpath === "/" || subpath === "") {
      return send(res, 200, {
        ok: true,
        routes: [
          { method: "POST", path: "/api/health/ingest" },
          { method: "GET",  path: "/api/health/export?user_id=..." },
          { method: "GET",  path: "/api/cgm/connect" },
          { method: "GET|POST", path: "/api/garmin/webhook" },
          { method: "POST", path: "/api/terra/webhook" },
        ],
      });
    }

    return send(res, 404, { ok: false, error: `No route for ${req.method} ${pathname}` });
  } catch (e) {
    console.error("API error:", e);
    return send(res, 500, { ok: false, error: "Internal error" });
  }
}
