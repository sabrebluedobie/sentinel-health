// server/api/index.js (or wherever your unified API router is)
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch"; // if not already available in your runtime

// ---- server Supabase client (service role) ----
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_KEY;

const serverSupabase =
  SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

function send(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).send(typeof body === "string" ? body : JSON.stringify(body));
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return null;
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

async function getUserIdFromAuthHeader(req) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  // supabase-js v2 can resolve the user from an access token:
  const { data, error } = await serverSupabase.auth.getUser(token);
  if (error) return null;
  return data?.user?.id ?? null;
}

// ----- Nightscout sync handler -----
async function nightscoutSync(req, res) {
  if (!serverSupabase) return send(res, 500, { ok: false, error: "Supabase not configured" });

  const body = await readBody(req);
  const sinceDays = Math.max(1, Math.min(90, Number(body?.sinceDays ?? 14)));

  // Resolve the calling user
  const user_id = (await getUserIdFromAuthHeader(req)) || body?.user_id || null;
  if (!user_id) return send(res, 401, { ok: false, error: "Not authenticated" });

  // Load that user's Nightscout connection
  const { data: conn, error: ce } = await serverSupabase
    .from("nightscout_connections")
    .select("url, token, api_secret")
    .eq("user_id", user_id)
    .maybeSingle();

  if (ce) return send(res, 500, { ok: false, error: ce.message });
  if (!conn?.url) return send(res, 400, { ok: false, error: "No Nightscout URL saved" });

  // Build Nightscout request
  const base = conn.url.replace(/\/+$/, "");
  const sinceIso = new Date(Date.now() - sinceDays * 86400000).toISOString();

  // entries/sgv is standard for glucose values
  const qs = new URLSearchParams({
    count: "1200",
    "find[dateString][$gte]": sinceIso,
  });
  if (conn.token) qs.set("token", conn.token);

  const nsUrl = `${base}/api/v1/entries/sgv.json?${qs.toString()}`;
  const resp = await fetch(nsUrl, {
    headers: conn.api_secret
      ? { "API-SECRET": conn.api_secret } // If you stored SHA1 hex, send as-is.
      : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    return send(res, 502, {
      ok: false,
      error: `Nightscout error ${resp.status}: ${text.slice(0, 400)}`,
    });
  }

  const entries = await resp.json(); // [{ sgv, date, dateString, direction, ... }]
  const rows = (entries || [])
    .map((e) => {
      const iso =
        e.dateString ? new Date(e.dateString).toISOString()
        : e.date ? new Date(e.date).toISOString()
        : null;
      const v = Number(e.sgv);
      if (!iso || !isFinite(v)) return null;
      return {
        user_id,
        device_time: iso,
        value_mgdl: v,
        trend: e.direction ?? null,
        source: "nightscout",
        created_at: new Date().toISOString(),
        // note: e.device ?? null, // uncomment if you have a 'note' column and want device info
      };
    })
    .filter(Boolean);

  if (!rows.length) return send(res, 200, { ok: true, inserted: 0 });

  // Optional but recommended: dedupe on (user_id, device_time)
  // In SQL, add once:
  // create unique index if not exists glucose_readings_user_time_key on public.glucose_readings(user_id, device_time);
  let inserted = 0;
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: ie } = await serverSupabase
      .from("glucose_readings")
      // Use upsert if you created the unique index above:
      // .upsert(chunk, { onConflict: "user_id,device_time", ignoreDuplicates: true });
      .insert(chunk); // plain insert if you don't have the unique index
    if (ie) return send(res, 500, { ok: false, error: ie.message, inserted });
    inserted += chunk.length;
  }

  return send(res, 200, { ok: true, inserted });
}
