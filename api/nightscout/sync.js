import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const count = parseInt(req.query.count) || 50;
    
    // Get credentials
    const nsUrl = process.env.VITE_NIGHTSCOUT_URL;
    const nsSecret = process.env.VITE_NIGHTSCOUT_API_SECRET;

    if (!nsUrl || !nsSecret) {
      return res.status(400).json({ 
        ok: false,
        error: 'Nightscout not configured' 
      });
    }

    // Hash the API secret
    const hashedSecret = crypto
      .createHash('sha1')
      .update(nsSecret)
      .digest('hex');

    // Fetch treatments from Nightscout
    const response = await fetch(`${nsUrl}/api/v1/treatments?count=${count}`, {
      headers: {
        'API-SECRET': hashedSecret,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        ok: false,
        error: 'Failed to fetch from Nightscout',
        details: await response.text()
      });
    }

    const treatments = await response.json();

    return res.status(200).json({ 
      ok: true,
      data: treatments,
      count: treatments.length
    });

  } catch (error) {
    console.error('Nightscout sync error:', error);
    return res.status(500).json({ 
      ok: false,
      error: 'Sync failed',
      details: error.message 
    });
  }
}