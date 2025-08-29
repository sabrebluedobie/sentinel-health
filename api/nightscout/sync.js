// server/api/index.js (or wherever nightscoutSync lives)

// replace your generic `send()` with a JSON-specific helper
function sendJSON(res, status, obj, headers = {}) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).send(JSON.stringify(obj));
}

// then inside nightscoutSync, ONLY use sendJSON(...)
return sendJSON(res, 200, { ok: true, inserted });
// and for errors:
return sendJSON(res, 500, { ok: false, error: ie.message, inserted });
