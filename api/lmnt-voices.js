// /api/lmnt-voices.js
// Vercel Serverless Function: list voices from LMNT (proxied)
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const apiBase = process.env.LMNT_API_BASE;
    const apiKey  = process.env.LMNT_API_KEY;
    const path    = process.env.LMNT_VOICES_PATH || '/voices';

    if (!apiBase || !apiKey) {
      res.status(500).json({ error: 'Missing LMNT_API_BASE or LMNT_API_KEY env vars' });
      return;
    }

    const url = `${apiBase.replace(/\/$/, '')}${path}`;
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const text = await r.text();
    if (!r.ok) {
      res.status(r.status).json({ error: text || 'Upstream error' });
      return;
    }

    // Try to parse; if not JSON, return empty
    let data;
    try { data = JSON.parse(text); }
    catch { data = []; }

    // Normalize a simple shape: [{id, name}]
    let voices = Array.isArray(data) ? data : (Array.isArray(data?.voices) ? data.voices : []);
    voices = voices.map(v => ({
      id: v.id || v.voice_id || v.name || 'voice',
      name: v.name || v.display_name || v.id || v.voice_id || 'Voice'
    }));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(voices);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}