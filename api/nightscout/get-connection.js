// api/nightscout/get-connection.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Get user's Nightscout connection settings
 * GET /api/nightscout/get-connection
 */
export default async function handler(req, res) {
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

    // Get user's connection
    const { data, error } = await supabase
      .from('nightscout_connections')
      .select('id, nightscout_url, is_active, last_synced_at, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found
        return res.status(200).json({
          ok: true,
          connected: false,
          connection: null
        });
      }
      throw error;
    }

    return res.status(200).json({
      ok: true,
      connected: true,
      connection: {
        id: data.id,
        nightscout_url: data.nightscout_url,
        is_active: data.is_active,
        last_synced_at: data.last_synced_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Get connection error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to get Nightscout connection'
    });
  }
}