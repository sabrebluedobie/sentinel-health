import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { uid, url, token } = req.query; // store these per user in cgm_connections if you like
  const headers = token ? { "api-secret": token } : {};
  const r = await fetch(`${url.replace(/\/$/, "")}/api/v1/entries.json?count=100`, { headers });
  const entries = await r.json();

  const rows = entries.map(e => ({
    user_id: uid,
    device_time: e.dateString,
    value_mgdl: e.sgv,
    trend: e.direction || null,
    source: "nightscout",
    note: null,
    reading_type: null,
    timezone_offset_min: null
  }));

  if (rows.length) await supabase.from("glucose_readings").insert(rows);
  res.status(200).json({ inserted: rows.length });
}
