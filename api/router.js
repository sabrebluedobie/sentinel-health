// api/router.js
import { nsSave, nsTest, nsSync } from "../server/nightscout.js";
import { garminWebhook } from "../server/garmin.js";
// ... other handlers from ../server/*

export default async function handler(req, res) {
  const { url, method } = req;
  // normalize to path
  const path = (url || "").replace(/^\/api\/?/, "/");

  try {
    // Nightscout endpoints
    if (path === "/nightscout/save" && method === "POST") return nsSave(req, res);
    if (path === "/nightscout/test" && method === "POST") return nsTest(req, res);
    if (path === "/nightscout/sync" && method === "POST") return nsSync(req, res);

    // Webhooks
    if (path === "/garmin/webhook" && method !== "GET") return garminWebhook(req, res);

    // …add the rest of your routes in this single file

    res.statusCode = 404;
    res.end("Not found");
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
}
