// api/nightscout/test.js
import crypto from 'crypto';

/**
 * Test Nightscout connection
 * GET /api/nightscout/test
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const nightscoutUrl = process.env.NIGHTSCOUT_URL;
    const apiSecret = process.env.NIGHTSCOUT_API_SECRET;

    // Validate environment variables
    if (!nightscoutUrl) {
      return res.status(500).json({ 
        ok: false, 
        error: 'NIGHTSCOUT_URL not configured' 
      });
    }

    if (!apiSecret) {
      return res.status(500).json({ 
        ok: false, 
        error: 'NIGHTSCOUT_API_SECRET not configured' 
      });
    }

    // Hash the API secret (Nightscout requires SHA1 hash)
    const hashedSecret = crypto
      .createHash('sha1')
      .update(apiSecret)
      .digest('hex');

    // Test connection to Nightscout status endpoint
    const response = await fetch(`${nightscoutUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': hashedSecret,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Nightscout returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      message: 'Nightscout connection successful',
      version: data.version || 'unknown',
      serverTime: data.serverTime,
      status: data.status
    });

  } catch (error) {
    console.error('Nightscout test error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to connect to Nightscout'
    });
  }
}