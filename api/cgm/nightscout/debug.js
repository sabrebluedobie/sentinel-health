import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res){
  try{
    const out = { ok:false, steps:{} };
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) { out.steps.auth="no bearer"; return res.status(401).json(out); }
    out.steps.auth="bearer ok";

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const NS_TOKEN_KEY = process.env.NS_TOKEN_KEY;
    out.steps.env = { SUPABASE_URL:!!SUPABASE_URL, SUPABASE_ANON_KEY:!!SUPABASE_ANON_KEY, NS_TOKEN_KEY:!!NS_TOKEN_KEY };
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).json(out);
    if (!NS_TOKEN_KEY) return res.status(500).json(out);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } }});
    const { data: me } = await supabase.auth.getUser();
    const userId = me?.user?.id; if (!userId){ out.steps.user="no user"; return res.status(401).json(out); }
    out.steps.user = `user ${userId.substring(0,8)}…`;

    const { error:keyErr } = await supabase.rpc("set_app_key", { k:"app.ns_token_key", v:NS_TOKEN_KEY });
    out.steps.set_app_key = keyErr?.message || "ok";
    if (keyErr) return res.status(500).json(out);

    const safe = await supabase.rpc("get_ns_settings");
    out.steps.get_ns_settings = safe.error ? safe.error.message : (safe.data?.[0] || null);
    if (!safe.data?.[0]){ out.error="no settings row"; return res.status(200).json(out); }

    const conn = await supabase.rpc("get_ns_conn");
    if (conn.error){ out.steps.get_ns_conn = conn.error.message; return res.status(500).json(out); }
    const row = conn.data?.[0];
    out.steps.get_ns_conn = { has_url: !!row?.ns_url, has_read_token: !!row?.token_read, has_sha1: !!row?.token_sha1 };
    if (!row?.ns_url || (!row?.token_read && !row?.token_sha1)){ out.error="missing url/token"; return res.status(200).json(out); }

    const base = row.ns_url.replace(/\/+$/, "");
    const headers = { Accept:"application/json", "User-Agent":"sentinel-debug" };
    const statusResp = await fetch(`${base}/api/v1/status.json${row.token_read?`?token=${row.token_read}`:""}`, { headers: row.token_sha1 && !row.token_read ? { ...headers, "api-secret": String(row.token_sha1).toLowerCase() } : headers });
    out.steps.ns_status = statusResp.status;
    if (!statusResp.ok) { out.error=`Nightscout status ${statusResp.status}`; return res.status(502).json(out); }

    out.ok=true; return res.status(200).json(out);
  }catch(e){ return res.status(500).json({ ok:false, error: e?.message || "Internal error" }); }
}