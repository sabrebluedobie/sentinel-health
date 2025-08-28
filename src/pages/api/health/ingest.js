// pages/api/health/ingest.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const { createClient } = await import("@supabase/supabase-js");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // keep SECRET in Vercel env

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Missing Supabase env vars" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { user_id, source, type, start_time, end_time, value, unit, raw } = req.body || {};
    if (!user_id || !source || !type || !start_time) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const { error } = await supabase
      .from("health_readings")
      .insert([{ user_id, source, type, start_time, end_time: end_time || null, value: value ?? null, unit: unit || null, raw: raw ?? null }]);

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
