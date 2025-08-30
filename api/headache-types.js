// api/headache-types.js
import { streamText } from 'ai';
import OpenAI from 'openai';

// If you prefer the new provider style:
// import { createOpenAI } from '@ai-sdk/openai';
// const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  runtime: 'edge',
};

function buildPrompt(symptoms) {
  return `
You are a medical-education assistant (NOT a diagnostic tool). Given the patient's reported headache symptoms, 
return a concise JSON array of possible headache types with short distinguishing features and an estimated likelihood.

REQUIREMENTS:
- Return ONLY valid JSON (no commentary).
- JSON array of objects, each object with:
  - "type": string (e.g., "Migraine", "Tension", "Cluster", "Sinus", "Medication-overuse")
  - "keySymptoms": string[] (2–4 short bullet points)
  - "likelihood": number (0.0–1.0) that sums to ~1.0 across items
- Include 4–6 items max.
- Consider red flags (e.g., thunderclap headache, focal neuro deficits) by lowering likelihoods and adding a "See a clinician" item if appropriate.

Patient-reported symptoms:
${symptoms || 'none provided'}
`.trim();
}

export default async function handler(req) {
  try {
    const { symptoms } = (req.method === 'POST') ? await req.json() : {};
    const prompt = buildPrompt(symptoms);

    // Using the low-friction 'ai' package server-side call.
    const { textStream } = await streamText({
      // If you're on the new provider API, replace with: model: openai('gpt-5')
      model: 'openai/gpt-5',
      prompt,
    });

    // Collect the streamed text (JSON)
    let jsonText = '';
    for await (const chunk of textStream) {
      jsonText += chunk;
    }

    // Best-effort parse & shape
    let parsed = [];
    try {
      parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      parsed = [];
    }

    // Normalize + clamp
    const items = parsed
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
        likelihood: Math.max(0, Math.min(1, Number(x.likelihood))),
      }));

    const total = items.reduce((sum, i) => sum + i.likelihood, 0) || 1;
    const normalized = items.map((i) => ({ ...i, likelihood: i.likelihood / total }));

    return new Response(JSON.stringify({ items: normalized }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
