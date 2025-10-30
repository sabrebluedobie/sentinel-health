import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get credentials from environment variables (your testing)
    // OR from request body (user's credentials)
    let nightscoutUrl, apiSecret;

    if (req.method === 'POST' && req.body) {
      nightscoutUrl = req.body.nightscout_url;
      apiSecret = req.body.api_secret;
    } else {
      nightscoutUrl = process.env.VITE_NIGHTSCOUT_URL;
      apiSecret = process.env.VITE_NIGHTSCOUT_API_SECRET;
    }

    if (!nightscoutUrl || !apiSecret) {
      return res.status(400).json({ 
        ok: false,
        error: 'Nightscout not configured' 
      });
    }

    // Hash the API secret
    const hashedSecret = crypto
      .createHash('sha1')
      .update(apiSecret)
      .digest('hex');

    // Test connection
    const response = await fetch(`${nightscoutUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': hashedSecret,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(401).json({ 
        ok: false,
        error: 'Connection test failed'
      });
    }

    const status = await response.json();

    return res.status(200).json({ 
      ok: true,
      version: status.version,
      serverName: status.name || 'Nightscout',
      data: status
    });

  } catch (error) {
    console.error('Nightscout test error:', error);
    return res.status(500).json({ 
      ok: false,
      error: 'Test failed',
      details: error.message 
    });
  }
}