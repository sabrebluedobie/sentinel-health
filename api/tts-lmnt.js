// /api/tts-lmnt.js
// Vercel Serverless Function: synthesize TTS with LMNT (proxied)
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const apiBase = process.env.LMNT_API_BASE;
    const apiKey  = process.env.LMNT_API_KEY;
    const path    = process.env.LMNT_TTS_PATH || '/tts';

    if (!apiBase || !apiKey) {
      res.status(500).json({ error: 'Missing LMNT_API_BASE or LMNT_API_KEY env vars' });
      return;
    }

    const { text, voice, format = 'mp3' } = req.body || {};
    if (!text || !voice) {
      res.status(400).json({ error: 'Missing text or voice' });
      return;
    }

    const url = `${apiBase.replace(/\/$/, '')}${path}`;

    // Many providers expect JSON like { text, voice, format }
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg, audio/webm, application/json'
      },
      body: JSON.stringify({ text, voice, format })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({ error: errText || 'TTS upstream error' });
      return;
    }

    // Stream or buffer the audio back to browser
    const arrayBuf = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const mime = format === 'webm' ? 'audio/webm' : 'audio/mpeg';

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}