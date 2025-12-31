// api/nightscout/connection.js
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeUrl(input) {
  let url = String(input || "").trim();
  if (!url) return url;

  // add scheme if missing
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  // remove trailing slash
  url = url.replace(/\/$/, "");

  // validate
  // (will throw if invalid)
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
    const { nightscout_url, api_secret, user_id } = req.body;

    if (!nightscout_url || !api_secret || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: nightscout_url, api_secret, user_id",
      });
    }

    let cleanUrl;
    try {
      cleanUrl = normalizeUrl(nightscout_url);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Nightscout URL is not valid. Include https:// and try again.",
      });
    }

    // Nightscout requires SHA1(API_SECRET) in 'API-SECRET' header
    const hashedSecret = crypto.createHash("sha1").update(api_secret).digest("hex");

    // Test connection first
    const testResponse = await fetch(`${cleanUrl}/api/v1/status`, {
      headers: {
        "API-SECRET": hashedSecret,
        Accept: "application/json",
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text().catch(() => "");
      console.error("Nightscout test failed:", testResponse.status, errorText);
      return res.status(401).json({
        success: false,
        error: "Invalid Nightscout URL or API Secret. Please check your credentials.",
      });
    }

    // Save to DB (url + api_secret)
      const { data: savedConnection, error: saveError } = await supabase
    .from("nightscout_connections")
    .upsert(
      {
        user_id,
        url: cleanUrl,
        api_secret: hashedSecret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id, url, updated_at")
    .single();

  if (saveError) {
    console.error("Database save error:", saveError);
    return res.status(500).json({
      success: false,
      error: `Failed to save connection: ${saveError.message}`,
    });
  }

  if (!savedConnection) {
    return res.status(500).json({
      success: false,
      error: "Connection saved, but no row returned from database.",
    });
  }

    return res.status(200).json({
      success: true,
      message: "Nightscout connection saved successfully",
      data: {
        id: savedConnection.id,
        url: savedConnection.url,
        updated_at: savedConnection.updated_at,
      },
    });
  } catch (error) {
    console.error("Nightscout connection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to save Nightscout connection",
    });
  }
}
