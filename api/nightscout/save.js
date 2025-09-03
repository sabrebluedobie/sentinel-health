// api/nightscout/save.js
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

    // Verify the user from the JWT
    const { data: gu, error: gErr } = await admin.auth.getUser(token);
    if (gErr || !gu?.user?.id) return res.status(401).json({ ok: false, error: "Invalid user token" });
    const userId = gu.user.id;

    const { url, token: nsToken, api_secret } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ ok: false, error: "Valid Nightscout URL required" });

    // Upsert the connection for this user
    const { error: upErr } = await admin
      .from("nightscout_connections")
      .upsert(
        { user_id: userId, url: url.trim(), token: nsToken || null, api_secret: api_secret || null, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (upErr) throw upErr;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[nightscout/save]", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
