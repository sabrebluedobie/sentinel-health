// supabase/functions/tts-lmnt/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { text, voice = "morgan", model = "blizzard", format = "mp3", sample_rate = 24000, language = "auto" } =
      await req.json();

    if (!text || typeof text !== "string") {
      return new Response("Missing text", { status: 400 });
    }

    const key = Deno.env.get("LMNT_API_KEY");
    if (!key) return new Response("Missing LMNT_API_KEY", { status: 500 });

    const lmntRes = await fetch("https://api.lmnt.com/v1/ai/speech/bytes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify({ text, voice, model, format, sample_rate, language }),
    });

    if (!lmntRes.ok) {
      const msg = await lmntRes.text();
      return new Response(msg || "LMNT error", { status: lmntRes.status });
    }

    return new Response(lmntRes.body, {
      status: 200,
      headers: {
        "Content-Type": format === "webm" ? "audio/webm" : "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(`Bad request: ${e?.message ?? e}`, { status: 400 });
  }
});
