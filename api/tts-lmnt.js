// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

export default async function handler(req, res) {
  try {
    if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiBase = process.env.LMNT_API_BASE;
    const apiKey  = process.env.LMNT_API_KEY;
    const path    = process.env.LMNT_TTS_PATH || '/tts';
    if (!apiBase || !apiKey) return res.status(500).json({ error: 'Missing LMNT_API_BASE or LMNT_API_KEY env vars' });
    const { text, voice, format = 'mp3' } = req.body || {};
    if (!text || !voice) return res.status(400).json({ error: 'Missing text or voice' });
    const url = `${apiBase.replace(/\/$/, '')}${path}`;
    const upstream = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'audio/mpeg, audio/webm, application/json' }, body: JSON.stringify({ text, voice, format }) });
    if (!upstream.ok) { const errText = await upstream.text(); return res.status(upstream.status).json({ error: errText || 'TTS upstream error' }); }
    const arrayBuf = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const mime = format === 'webm' ? 'audio/webm' : 'audio/mpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (err) { return res.status(500).json({ error: String(err?.message || err) }); }