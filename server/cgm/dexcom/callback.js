import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // server key

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    const user_id = req.query.uid; // pass uid in your frontend "state" or cookie
    const BASE = process.env.DEXCOM_BASE || "https://sandbox-api.dexcom.com";

    // Exchange code → tokens
    const tok = await fetch(`${BASE}/v2/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: process.env.DEXCOM_CLIENT_SECRET,
        client_id: process.env.DEXCOM_CLIENT_ID,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.DEXCOM_REDIRECT_URI
      })
    }).then(r => r.json());

    if (!tok.access_token) return res.status(400).json(tok);

    // Store tokens
    await supabase.from("oauth_tokens").upsert({
      user_id, provider: "dexcom",
      access_token: tok.access_token,
      refresh_token: tok.refresh_token || null,
      expires_at: tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null
    }, { onConflict: "user_id,provider" });

    await supabase.from("cgm_connections").upsert({ user_id, provider: "dexcom", status: "active" }, { onConflict: "user_id,provider" });

    // Done → back to app
    res.redirect("/dashboard?connected=dexcom");
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
