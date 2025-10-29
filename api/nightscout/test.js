// api/nightscout/test.js
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Test Nightscout connection using user's stored credentials
 * GET /api/nightscout/test
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    // Get user's Nightscout connection
    const { data: connection, error: connError } = await supabase
      .from('nightscout_connections')
      .select('nightscout_url, api_secret, is_active')
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Nightscout not configured. Add your credentials in Settings.' 
      });
    }

    if (!connection.is_active) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Nightscout connection is disabled' 
      });
    }

    const nightscoutUrl = connection.nightscout_url;
    const apiSecret = connection.api_secret;

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