import { createClient } from '@supabase/supabase-js';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id parameter' });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get user's Nightscout connection
    const { data: connection, error } = await supabase
      .from('nightscout_connections')
      .select('nightscout_url, api_secret')
      .eq('user_id', user_id)
      .single();

    if (error || !connection) {
      return res.status(404).json({ 
        error: 'No Nightscout connection found for this user' 
      });
    }

    // Test the connection - api_secret is already hashed in the database
    const testUrl = `${connection.nightscout_url}/api/v1/status.json`;
    const response = await fetch(testUrl, {
      headers: {
        'API-SECRET': connection.api_secret, // Use the hashed secret from database
      },
    });

    if (!response.ok) {
      return res.status(400).json({ 
        error: `Nightscout connection failed: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();

    return res.status(200).json({ 
      success: true,
      message: 'Nightscout connection test successful',
      nightscout_status: {
        name: data.name || 'Nightscout',
        version: data.version || 'Unknown',
        apiEnabled: data.apiEnabled || false,
        serverTime: data.serverTime || new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error testing Nightscout connection:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}