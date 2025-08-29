// api/nightscout/test.js
import crypto from "crypto";

// small body reader
async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  try {
    return await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); }
      });
      req.on("error", reject);
    });
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "POST only" });
    return;
  }

  try {
    const { url, token, api_secret, count = 3 } = await readBody(req);
    if (!url) throw new Error("Missing url");

    const base = String(url).replace(/\/+$/, "");
    const qs = new URLSearchParams({ count: String(count) });
    if (token) qs.set("token", token);

    const endpoint = `${base}/api/v1/entries.json?${qs.toString()}`;
    const headers = {};
    if (!token && api_secret) {
      headers["api-secret"] = crypto
        .createHash("sha1")
        .update(String(api_secret))
        .digest("hex");
    }

    const r = await fetch(endpoint, { headers, redirect: "follow" });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Nightscout error ${r.status}: ${text || r.statusText}`);
    }
    const rows = await r.json();

    const sample = (rows || []).slice(0, 3).map((e) => ({
      sgv: e.sgv ?? e.mgdl ?? null,
      direction: e.direction ?? null,
      time: e.dateString || (e.date ? new Date(e.date).toISOString() : null),
      time_local:
        e.dateString || (e.date ? new Date(e.date).toLocaleString() : null),
    }));

    res.status(200).json({ ok: true, count: (rows || []).length, sample });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message || String(e) });
  }
}
