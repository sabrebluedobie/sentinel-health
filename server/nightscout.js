// server/nightscout.js
import crypto from "node:crypto";

const BASE = process.env.NIGHTSCOUT_URL;           // e.g. https://your-site.onrender.com
const RAW_SECRET = process.env.NIGHTSCOUT_API_SECRET; // your Nightscout API_SECRET (plaintext)
if (!BASE) throw new Error("Missing env NIGHTSCOUT_URL");
if (!RAW_SECRET) throw new Error("Missing env NIGHTSCOUT_API_SECRET");

// Nightscout requires SHA1(API_SECRET) in 'API-SECRET' header
const API_SECRET = crypto.createHash("sha1").update(RAW_SECRET).digest("hex");

/** Minimal Nightscout fetch helper */
async function nsFetch(path, { method = "GET", body } = {}) {
  const url = `${BASE.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "API-SECRET": API_SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nightscout ${method} ${path} ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

/** GET /api/nightscout/test -> checks status */
export async function nsTest(_req, res) {
  try {
    const data = await nsFetch("/api/v1/status.json");
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, data }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
  }
}

/**
 * POST /api/nightscout/save
 * Body:
 *   { kind: "glucose" | "note" | "migraine", ...fields }
 *  - glucose -> /api/v1/entries  (SGV or MBG)
 *  - note/migraine -> /api/v1/treatments (eventType with notes)
 */
export async function nsSave(req, res) {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

    const { kind } = body || {};
    if (!kind) throw new Error("Missing 'kind'");

    if (kind === "glucose") {
      // expect: { value_mgdl, time, reading_type, trend, note }
      const { value_mgdl, time, reading_type, trend, note } = body;
      if (!value_mgdl || !time) throw new Error("value_mgdl and time required");

      const iso = new Date(time).toISOString();
      const epochMs = Date.parse(iso);
      const isFinger = (reading_type || "").toLowerCase() === "mbg" || (reading_type || "").toLowerCase() === "finger";

      const entry = {
        type: isFinger ? "mbg" : "sgv",
        date: epochMs,
        dateString: iso,
        device: "sentinel-manual",
        // Nightscout expects 'sgv' for CGM, 'mbg' for finger
        ...(isFinger ? { mbg: Number(value_mgdl) } : { sgv: Number(value_mgdl) }),
        ...(trend ? { direction: trend } : {}),
        ...(note ? { notes: String(note) } : {}),
      };

      const out = await nsFetch("/api/v1/entries.json", { method: "POST", body: [entry] });
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, out }));
    }

    // Treat everything else as a Treatment (note-like)
    if (kind === "note" || kind === "migraine") {
      // For migraine we store as a Note with structured text
      const {
        start_time, end_time, severity, triggers, meds_taken, notes,
        title // optional
      } = body;

      const created = start_time ? new Date(start_time).toISOString() : new Date().toISOString();
      const lines = [];
      if (kind === "migraine") {
        lines.push("Migraine");
        if (severity != null) lines.push(`Severity: ${severity}`);
        if (triggers) lines.push(`Triggers: ${triggers}`);
        if (meds_taken) lines.push(`Meds: ${meds_taken}`);
      }
      if (notes) lines.push(notes);
      if (end_time) lines.push(`Ended: ${new Date(end_time).toLocaleString()}`);

      const treatment = {
        eventType: title || (kind === "migraine" ? "Note" : "Note"),
        notes: lines.join("\n"),
        created_at: created,
      };

      const out = await nsFetch("/api/v1/treatments.json", { method: "POST", body: [treatment] });
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, out }));
    }

    throw new Error(`Unsupported kind: ${kind}`);
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
  }
}

/**
 * (optional) GET /api/nightscout/sync?count=50
 * pull latest entries (useful for dashboard preview)
 */
export async function nsSync(req, res) {
  try {
    const url = new URL(req.url, "http://x");
    const count = Number(url.searchParams.get("count") || 50);
    const data = await nsFetch(`/api/v1/entries.json?count=${count}`);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, data }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
  }
}
