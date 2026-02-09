// api/router.js
import { nsSave, nsTest, nsSync } from "../server/nightscout.js";
import dexcomAuthorize from "./dexcom/authorize.js";
import dexcomCallback from "./dexcom/callback.js";
import dexcomSync from "./dexcom/sync.js";

export default async function handler(req, res) {
  try {
    const path = (req.url || "").replace(/^\/api\/?/, "/");
    const method = req.method;

    // Nightscout endpoints
    if (path === "/nightscout/test" && method === "GET")  return nsTest(req, res);
    if (path === "/nightscout/save" && method === "POST") return nsSave(req, res);
    if (path === "/nightscout/sync" && method === "GET")  return nsSync(req, res);

    // Dexcom endpoints
    if (path === "/dexcom/authorize") return dexcomAuthorize(req, res);
    if (path === "/dexcom/callback")  return dexcomCallback(req, res);
    if (path === "/dexcom/sync")      return dexcomSync(req, res);

    res.statusCode = 404;
    res.end("Not found");
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
}