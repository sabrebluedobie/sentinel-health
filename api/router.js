// api/router.js
// Single-function router (Hobby plan safe).
// Wires Nightscout endpoints to handlers under /server/cgm/nightscout/*

import nsSave from "../server/cgm/nightscout/save.js";
import nsSync from "../server/cgm/nightscout/sync.js";
import nsTest from "../server/cgm/nightscout/test.js";

// --- helpers ---
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function normalizePath(url = "") {
  try {
    const u = new URL(url, "http://localhost");
    return u.pathname.replace(/^\/api\/?/, "/");
  } catch {
    return url.replace(/^\/api\/?/, "/");
  }
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const method = req.method || "GET";
  const path = normalizePath(req.url || "");

  try {
    // --- Nightscout endpoints ---
    if (path === "/nightscout/save" && method === "POST") return nsSave(req, res);
    if (path === "/nightscout/test" && method === "POST") return nsTest(req, res);
    if (path === "/nightscout/sync" && method === "POST") return nsSync(req, res);

    // 404 fallback
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, error: `Not found: ${method} ${path}` }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
}
