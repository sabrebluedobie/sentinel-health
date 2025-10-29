// api/nightscout/sync.js
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Sync/pull recent entries from Nightscout
 * GET /api/nightscout/sync?count=50
 * 
 * Returns recent glucose entries from Nightscout
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
        error: 'Nightscout not configured' 
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

    // Hash the API secret
    const hashedSecret = crypto
      .createHash('sha1')
      .update(apiSecret)
      .digest('hex');

    // Get count from query params (default: 50, max: 1000)
    const count = Math.min(parseInt(req.query.count) || 50, 1000);

    // Fetch entries from Nightscout
    const response = await fetch(
      `${nightscoutUrl}/api/v1/entries.json?count=${count}`,
      {
        headers: {
          'API-SECRET': hashedSecret,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nightscout returned ${response.status}: ${response.statusText}`);
    }

    const entries = await response.json();

    // Transform Nightscout entries to Sentrya format
    const transformed = entries.map(entry => ({
      // Nightscout uses Unix timestamp (ms)
      time: new Date(entry.date).toISOString(),
      value_mgdl: entry.sgv || entry.mbg,
      reading_type: entry.type === 'mbg' ? 'fingerstick' : 'cgm',
      trend: entry.direction || null,
      note: entry.notes || null,
      device: entry.device || 'Nightscout',
      nightscout_id: entry._id
    }));

    return res.status(200).json({
      ok: true,
      message: `Synced ${transformed.length} entries from Nightscout`,
      count: transformed.length,
      data: transformed
    });

  } catch (error) {
    console.error('Nightscout sync error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to sync from Nightscout'
    });
  }
}