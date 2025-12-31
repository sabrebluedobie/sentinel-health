// api/nightscout/connection.js
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // This is the #1 Vercel issue.
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY on the server");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeUrl(input) {
  let url = String(input || "").trim();
  if (!url) return url;

  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/$/, "");

  // throws if invalid
  new URL(url);

  return url;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { nightscout_url, api_secret, user_id } = req.body || {};

    if (!nightscout_url || !api_secret || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: nightscout_url, api_secret, user_id",
      });
    }

    let cleanUrl;
    try {
      cleanUrl = normalizeUrl(nightscout_url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: "Nightscout URL is not valid. Include https:// and try again.",
      });
    }

    const hashedSecret = crypto.createHash("sha1").update(api_secret).digest("hex");

    // 1) Test Nightscout connection
    const testUrl = `${cleanUrl}/api/v1/status`;
    const testResponse = await fetch(testUrl, {
      headers: {
        "API-SECRET": hashedSecret,
        Accept: "application/json",
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text().catch(() => "");
      return res.status(401).json({
        success: false,
        error: "Invalid Nightscout URL or API Secret. Please check your credentials.",
        debug: {
          testUrl,
          status: testResponse.status,
          body: errorText.slice(0, 300),
        },
      });
    }

    // 2) Save to DB
    const payload = {
      user_id,
      url: cleanUrl,
      api_secret: hashedSecret,
      updated_at: new Date().toISOString(),
    };

    const { data: savedConnection, error: saveError } = await supabase
      .from("nightscout_connections")
      .upsert(payload, { onConflict: "user_id" })
      .select("id, url, updated_at")
      .maybeSingle();

    if (saveError) {
      return res.status(500).json({
        success: false,
        error: `Failed to save connection: ${saveError.message}`,
        debug: saveError,
      });
    }

    // If Supabase returns no row for some reason, don’t crash — re-fetch it.
    let row = savedConnection;
    if (!row) {
      const { data: fetched, error: fetchError } = await supabase
        .from("nightscout_connections")
        .select("id, url, updated_at")
        .eq("user_id", user_id)
        .maybeSingle();

      if (fetchError || !fetched) {
        return res.status(500).json({
          success: false,
          error: "Connection saved but could not be returned from database.",
          debug: { fetchError, user_id },
        });
      }
      row = fetched;
    }

    return res.status(200).json({
      success: true,
      message: "Nightscout connection saved successfully",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to save Nightscout connection",
      debug: error?.stack ? String(error.stack).slice(0, 800) : String(error),
    });
  }
}
