// api/nightscout/sync.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: "No auth token" });

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ ok: false, error: "Missing Supabase env vars" });

    const admin = createClient(supabaseUrl, serviceKey);

    // Identify user from JWT
    const { data: gu, error: gErr } = await admin.auth.getUser(token);
    if (gErr || !gu?.user?.id) return res.status(401).json({ ok: false, error: "Invalid user token" });
    const userId = gu.user.id;

    // Load saved Nightscout connection
    const { data: conn, error: cErr } = await admin
      .from("nightscout_connections")
      .select("url, token, api_secret")
      .eq("user_id", userId)
      .single();

    if (cErr || !conn?.url) return res.status(400).json({ ok: false, error: "No Nightscout URL saved" });

    const base = conn.url.replace(/\\/$/, "");
    const qs = new URLSearchParams({ count: String(288) }); // ~24h at 5-min cadence
    if (conn.token) qs.set("token", conn.token);

    // Fetch recent CGM entries
    const headers = {};
    if (conn.api_secret) headers["api-secret"] = conn.api_secret; // many Nightscout instances accept this header
    const resp = await fetch(`${base}/api/v1/entries.json?${qs.toString()}`, { headers });
    if (!resp.ok) return res.status(502).json({ ok: false, error: `Nightscout error ${resp.status}` });
    const entries = await resp.json();

    // Map to your table shape
    const rows = (Array.isArray(entries) ? entries : []).map((e) => ({
      user_id: userId,
      device_time: e.dateString || (e.date ? new Date(e.date).toISOString() : null),
      value_mgdl: e.sgv ?? null,
      source: "nightscout",
    })).filter(r => r.device_time && Number.isFinite(+r.value_mgdl));

    if (rows.length === 0) return res.status(200).json({ ok: true, inserted: 0 });

    // Upsert into glucose_readings; if you don't have a unique index on (user_id, device_time) this will behave like insert
    const { error: insErr } = await admin
      .from("glucose_readings")
      .upsert(rows, { onConflict: "user_id,device_time", ignoreDuplicates: true });

    if (insErr?.message?.includes("there is no unique or exclusion constraint")) {
      // Fallback: plain insert (may create duplicates if called repeatedly)
      await admin.from("glucose_readings").insert(rows);
    } else if (insErr) {
      throw insErr;
    }

    return res.status(200).json({ ok: true, inserted: rows.length });
  } catch (e) {
    console.error("[nightscout/sync]", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
