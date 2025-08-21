// supabase/functions/lmnt-voices/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  try {
    const key = Deno.env.get("LMNT_API_KEY");
    if (!key) return new Response("Missing LMNT_API_KEY", { status: 500 });

    const r = await fetch("https://api.lmnt.com/v1/ai/voice/list", {
      headers: { "X-API-Key": key },
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status });

    const json = await r.json();
    return new Response(JSON.stringify(json), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response(`Error: ${e?.message ?? e}`, { status: 500 });
  }
});
