// api/headache-types.js
// Minimal Node.js serverless function for Vercel (no Edge)
// Requires: env OPENAI_API_KEY set in Vercel → Project → Settings → Environment Variables

export const config = { runtime: 'nodejs' };

import { streamText } from 'ai';

export default async function handler(req, res) {
  try {
    const body = await readJson(req);
    const symptoms = body?.symptoms || '';

    const prompt = `
Return ONLY valid JSON: an array of 4–6 items.
Each item: { "type": string, "keySymptoms": string[], "likelihood": number 0..1 }.
Sum of likelihoods should be ~1. This is educational, not diagnostic.
Patient symptoms: ${symptoms || 'none provided'}
`.trim();

    const { textStream } = await streamText({
      model: 'openai/gpt-5',
      prompt,
    });

    let jsonText = '';
    for await (const chunk of textStream) jsonText += chunk;

    const items = normalize(safeParseArray(jsonText));
    res.setHeader('content-type', 'application/json');
    res.status(200).send(JSON.stringify({ items }));
  } catch (err) {
    res.setHeader('content-type', 'application/json');
    res.status(500).send(JSON.stringify({ error: err?.message || 'Server error' }));
  }
}

// --- tiny helpers ---
async function readJson(req) {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8') || '{}';
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function safeParseArray(txt) {
  try {
    const v = JSON.parse(txt);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function normalize(parsed) {
  const items = (parsed || [])
    .filter(
      (x) =>
        x &&
        typeof x.type === 'string' &&
        Array.isArray(x.keySymptoms) &&
        typeof x.likelihood === 'number'
    )
    .map((x) => ({
      type: x.type,
      keySymptoms: x.keySymptoms.slice(0, 4).map(String),
      likelihood: clamp01(Number(x.likelihood)),
    }));

  const total = items.reduce((s, i) => s + i.likelihood, 0) || 1;
  return items.map((i) => ({ ...i, likelihood: i.likelihood / total }));
}

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
