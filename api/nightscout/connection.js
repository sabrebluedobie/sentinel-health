// api/nightscout/connection.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for server-side
);

/**
 * Save or update user's Nightscout connection settings
 * POST /api/nightscout/connection
 * 
 * Body: { nightscout_url: string, api_secret: string }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { nightscout_url, api_secret } = req.body;

    // Validate inputs
    if (!nightscout_url || !api_secret) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: nightscout_url, api_secret' 
      });
    }

    // Validate URL format
    let validatedUrl;
    try {
      validatedUrl = new URL(nightscout_url);
      // Remove trailing slash if present
      validatedUrl = validatedUrl.origin + validatedUrl.pathname.replace(/\/$/, '');
    } catch {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid Nightscout URL format. Use https://your-site.herokuapp.com' 
      });
    }

    // Upsert connection (insert or update if exists)
    const { data, error } = await supabase
      .from('nightscout_connections')
      .upsert({
        user_id: user.id,
        nightscout_url: validatedUrl,
        api_secret: api_secret, // Consider encrypting this
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return res.status(200).json({
      ok: true,
      message: 'Nightscout connection saved',
      connection: {
        id: data.id,
        nightscout_url: data.nightscout_url,
        is_active: data.is_active,
        last_synced_at: data.last_synced_at
        // Don't return api_secret to frontend
      }
    });

  } catch (error) {
    console.error('Save connection error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to save Nightscout connection'
    });
  }
}