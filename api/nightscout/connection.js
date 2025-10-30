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
    const { nightscout_url, api_secret } = req.body;

    if (!nightscout_url || !api_secret) {
      return res.status(400).json({ 
        ok: false,
        error: 'Missing nightscout_url or api_secret' 
      });
    }

    // Hash the API secret with SHA1
    const hashedSecret = crypto
      .createHash('sha1')
      .update(api_secret)
      .digest('hex');

    // Test the connection
    const response = await fetch(`${nightscout_url}/api/v1/status`, {
      headers: {
        'API-SECRET': hashedSecret,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(401).json({ 
        ok: false,
        error: 'Invalid Nightscout URL or API Secret'
      });
    }

    const status = await response.json();

    return res.status(200).json({ 
      ok: true,
      token: hashedSecret,
      nightscoutUrl: nightscout_url,
      serverName: status.name || 'Nightscout',
      version: status.version,
      apiEnabled: status.apiEnabled
    });

  } catch (error) {
    console.error('Nightscout connection error:', error);
    return res.status(500).json({ 
      ok: false,
      error: 'Connection failed',
      details: error.message 
    });
  }
}