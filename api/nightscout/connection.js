import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nightscout_url, api_secret, user_id } = req.body;

    if (!nightscout_url || !api_secret || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: nightscout_url, api_secret, user_id' 
      });
    }

    // Hash the API secret with SHA1 (Nightscout's required format)
    const hashedSecret = crypto
      .createHash('sha1')
      .update(api_secret)
      .digest('hex');

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // First, test the connection with Nightscout
    const testUrl = `${nightscout_url}/api/v1/status.json`;
    const testResponse = await fetch(testUrl, {
      headers: {
        'API-SECRET': hashedSecret,
      },
    });

    if (!testResponse.ok) {
      return res.status(400).json({ 
        error: 'Failed to connect to Nightscout. Please check your URL and API secret.' 
      });
    }

    // Connection test successful, now save to database
    const { data, error } = await supabase
      .from('nightscout_connections')
      .upsert({
        user_id,
        nightscout_url,
        api_secret: hashedSecret, // Store the HASHED secret
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save connection to database',
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Nightscout connection saved successfully',
      data 
    });

  } catch (error) {
    console.error('Error saving Nightscout connection:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}