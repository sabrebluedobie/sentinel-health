import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { kind, nightscout_url, api_secret, ...data } = req.body;

    // Use env vars if not provided
    const nsUrl = nightscout_url || process.env.VITE_NIGHTSCOUT_URL;
    const nsSecret = api_secret || process.env.VITE_NIGHTSCOUT_API_SECRET;

    if (!nsUrl || !nsSecret) {
      return res.status(400).json({ 
        ok: false,
        error: 'Missing Nightscout credentials' 
      });
    }

    // Hash the API secret
    const hashedSecret = crypto
      .createHash('sha1')
      .update(nsSecret)
      .digest('hex');

    let treatment = {};

    // Format based on kind
    if (kind === 'glucose') {
      treatment = {
        type: 'sgv',
        sgv: data.value_mgdl,
        date: new Date(data.time).getTime(),
        dateString: new Date(data.time).toISOString(),
        device: 'Sentinel Health',
        notes: data.note || ''
      };
    } else if (kind === 'migraine') {
      treatment = {
        eventType: 'Note',
        created_at: new Date(data.start_time).toISOString(),
        notes: `Migraine - Severity: ${data.severity || 'N/A'}`,
        duration: data.end_time ? Math.round((new Date(data.end_time) - new Date(data.start_time)) / 60000) : null,
        enteredBy: 'Sentinel Health'
      };
      if (data.triggers) treatment.notes += `\nTriggers: ${data.triggers}`;
      if (data.meds_taken) treatment.notes += `\nMeds: ${data.meds_taken}`;
    } else if (kind === 'note') {
      treatment = {
        eventType: 'Note',
        created_at: data.start_time ? new Date(data.start_time).toISOString() : new Date().toISOString(),
        notes: data.notes || '',
        enteredBy: 'Sentinel Health'
      };
    }

    // Save to Nightscout
    const response = await fetch(`${nsUrl}/api/v1/treatments`, {
      method: 'POST',
      headers: {
        'API-SECRET': hashedSecret,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify([treatment])
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        ok: false,
        error: 'Failed to save to Nightscout',
        details: errorText
      });
    }

    const result = await response.json();

    return res.status(200).json({ 
      ok: true,
      saved: result.length || 1,
      data: result
    });

  } catch (error) {
    console.error('Nightscout save error:', error);
    return res.status(500).json({ 
      ok: false,
      error: 'Save failed',
      details: error.message 
    });
  }
}