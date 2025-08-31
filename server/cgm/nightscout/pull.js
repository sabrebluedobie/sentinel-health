import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";


// ---- Supabase (server) ----

function normalizeBaseUrl(raw){
  if(!raw) return null;
  let url = String(raw).trim();
  if(!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

export default async function handler(req, res){
  try{
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing Authorization Bearer token" });

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const NS_TOKEN_KEY = process.env.NS_TOKEN_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).json({ error: "Supabase env not set" });
    if (!NS_TOKEN_KEY) return res.status(500).json({ error: "NS_TOKEN_KEY not set" });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } }});
    const { data: me } = await supabase.auth.getUser();
    const userId = me?.user?.id;
    if (!userId) return res.status(401).json({ error: "Invalid user session" });

    const { error: keyErr } = await supabase.rpc("set_app_key", { k: "app.ns_token_key", v: NS_TOKEN_KEY });
    if (keyErr) return res.status(500).json({ error: `set_app_key: ${keyErr.message}` });

    const { data: connRows, error: connErr } = await supabase.rpc("get_ns_conn");
    if (connErr) return res.status(500).json({ error: `get_ns_conn: ${connErr.message}` });
    const conn = connRows?.[0];
    if (!conn?.ns_url) return res.status(200).json({ inserted: 0, reason: "no-connection" });

    const base = normalizeBaseUrl(conn.ns_url);
    if (!base) return res.status(400).json({ error: "Invalid Nightscout URL" });

    const headers = { Accept: "application/json", "User-Agent": "sentinel-sync" };
    const entriesUrl = new URL(`${base}/api/v1/entries/sgv.json`);
    entriesUrl.searchParams.set("count", "1000");
    if (conn.token_read) entriesUrl.searchParams.set("token", conn.token_read);
    else if (conn.token_sha1) headers["api-secret"] = String(conn.token_sha1).toLowerCase();

    // Optional status check
    const statusResp = await fetch(`${base}/api/v1/status.json`, { headers });
    if (!statusResp.ok) return res.status(502).json({ error: "Nightscout status failed", status: statusResp.status });

    const r = await fetch(entriesUrl.toString(), { headers });
    const raw = await r.text();
    if (!r.ok) return res.status(502).json({ error: "Nightscout entries failed", status: r.status });

    let entries=[]; try{ const p=JSON.parse(raw); entries = Array.isArray(p)?p:[]; } catch { return res.status(502).json({ error:"Invalid JSON from Nightscout" }); }

    const rows = entries
      .filter(e => Number.isFinite(e?.sgv) && (e?.date || e?.dateString))
      .map(e => {
        const iso = (typeof e.dateString==="string" && e.dateString.includes("T"))
          ? new Date(e.dateString).toISOString()
          : new Date(Number(e.date)).toISOString();
        return {
          user_id: userId, device_time: iso, value_mgdl: e.sgv,
          trend: e.direction ?? null, source: "nightscout",
          reading_type: null, note: null, timezone_offset_min: null,
          created_at: new Date().toISOString()
        };
      });

    if (!rows.length) return res.status(200).json({ inserted: 0, message: "No rows to insert." });

    const { error: upErr } = await supabase
      .from("glucose_readings")
      .upsert(rows, { onConflict: "user_id,device_time,source", ignoreDuplicates: true });

    if (upErr) return res.status(500).json({ error: "Supabase upsert failed" });

    return res.status(200).json({ inserted: rows.length });
  } catch (e){
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}