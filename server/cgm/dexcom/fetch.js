import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const user_id = req.query.uid; // for on-demand fetch; for cron, loop users
  const { data: tokRow } = await supabase.from("oauth_tokens").select("*").eq("user_id", user_id).eq("provider", "dexcom").single();
  if (!tokRow) return res.status(404).json({ error: "No Dexcom token" });

  const BASE = process.env.DEXCOM_BASE || "https://sandbox-api.dexcom.com";
  const end = new Date();
  const start = new Date(end.getTime() - 6 * 60 * 60 * 1000); // last 6h
  const qs = new URLSearchParams({ startDate: start.toISOString(), endDate: end.toISOString() });

  const resp = await fetch(`${BASE}/v3/users/self/egvs?${qs}`, {
    headers: { Authorization: `Bearer ${tokRow.access_token}` }
  });
  const data = await resp.json();

  const rows = (data?.egvs || []).map(e => ({
    user_id,
    device_time: e.displayTime || e.systemTime,
    reading_type: null,
    note: null,
    source: "dexcom",
    value_mgdl: e.value,
    trend: e.trend,
    timezone_offset_min: null
  }));

  if (rows.length) await supabase.from("glucose_readings").insert(rows);
  res.status(200).json({ inserted: rows.length });
}
