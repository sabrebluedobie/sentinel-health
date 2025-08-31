// api/router.js
import { nsSave, nsTest, nsSync } from "../server/nightscout.js";
// add other webhooks here if you need, but keep them all in this file

export default async function handler(req, res) {
  try {
    const path = (req.url || "").replace(/^\/api\/?/, "/");
    const method = req.method;

    if (path === "/nightscout/test" && method === "GET")  return nsTest(req, res);
    if (path === "/nightscout/save" && method === "POST") return nsSave(req, res);
    if (path === "/nightscout/sync" && method === "GET")  return nsSync(req, res);

    res.statusCode = 404;
    res.end("Not found");
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
}
