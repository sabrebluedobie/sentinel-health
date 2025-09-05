// Vercel Serverless Function (Node 18+)
const { createClient } = require("@supabase/supabase-js");

// ENV you must set in Vercel → Project Settings → Environment Variables
const SB_URL  = process.env.SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY; // service role key
const TIME_WINDOW_DAYS = 14; // safety window in case a previous run failed

// Fetch JSON helper with Nightscout "api-secret" header
async function fetchNightscout(url, apiSecret, count = 1000) {
  const res = await fetch(`${url.replace(/\/$/,"")}/api/v1/entries.json?count=${count}`, {
    headers: { "api-secret": apiSecret }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nightscout ${url} HTTP ${res.status} ${text}`);
  }
  return res.json();
}

module.exports = async (req, res) => {
  const started = Date.now();
  if (!SB_URL || !SB_KEY) {
    res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY" });
    return;
  }

  const supabase = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

  // 1) Get all active Nightscout integrations
  const { data: users, error: uerr } = await supabase
    .from("user_integrations_nightscout")
    .select("user_id, url, api_secret, active")
    .eq("active", true);

  if (uerr) {
    res.status(500).json({ error: `Supabase read integrations failed: ${uerr.message}` });
    return;
  }
  if (!users?.length) {
    res.status(200).json({ ok: true, message: "No active Nightscout integrations" });
    return;
  }

  let totalInserted = 0;
  const nowIso = new Date().toISOString();

  for (const row of users) {
    try {
      // 2) Figure out `since`
      const { data: st } = await supabase
        .from("nightscout_sync_state")
        .select("last_synced_at")
        .eq("user_id", row.user_id)
        .maybeSingle();

      const since = new Date(
        st?.last_synced_at || Date.now() - TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000
      );

      // 3) Pull latest entries (Nightscout returns newest first typically)
      const entries = await fetchNightscout(row.url, row.api_secret, 1000);

      // 4) Map and filter by since (use dateString if present, else date ms)
      const toIso = (e) =>
        e.dateString ? new Date(e.dateString) : new Date(e.date);

      const rows = [];
      for (const e of entries) {
        const dt = toIso(e);
        if (!dt || isNaN(dt)) continue;
        if (dt < since) continue; // skip old entries

        // Only map CGM entries with sgv
        if (typeof e.sgv !== "number") continue;

        rows.push({
          user_id: row.user_id,
          device_time: dt.toISOString(),
          value_mgdl: e.sgv,
          note: "nightscout-sync",
          source: "nightscout"
        });
      }

      if (rows.length) {
        // 5) Upsert to avoid duplicates (user_id,device_time unique)
        const { error: ierr } = await supabase
          .from("glucose_readings")
          .upsert(rows, { onConflict: "user_id,device_time" });

        if (ierr) throw ierr;
        totalInserted += rows.length;
      }

      // 6) Advance cursor
      const { error: serr } = await supabase
        .from("nightscout_sync_state")
        .upsert({ user_id: row.user_id, last_synced_at: nowIso });

      if (serr) throw serr;

    } catch (e) {
      // Log but continue with other users
      console.error(`Sync failed for user ${row.user_id}:`, e.message);
    }
  }

  res.status(200).json({
    ok: true,
    users: users.length,
    inserted: totalInserted,
    took_ms: Date.now() - started
  });
};