// api/nightscout/test.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get user_id from request body or query params
    const user_id = req.method === 'POST' ? req.body.user_id : req.query.user_id;

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing user_id parameter' 
      });
    }

    console.log(`Testing Nightscout connection for user: ${user_id}`);

    // Query the saved connection from database using correct column names
    const { data: connection, error: queryError } = await supabase
      .from('nightscout_connections')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (queryError || !connection) {
      console.error('No connection found:', queryError);
      return res.status(404).json({ 
        success: false,
        error: 'Nightscout not configured. Please connect your Nightscout first.' 
      });
    }

    // Use 'url' column (not nightscout_url)
    const nightscoutUrl = connection.url;
    const apiSecret = connection.api_secret;

    if (!nightscoutUrl || !apiSecret) {
      return res.status(400).json({ 
        success: false,
        error: 'Incomplete Nightscout configuration' 
      });
    }

    console.log(`Testing connection to: ${nightscoutUrl}/api/v1/status`);

    // Test the connection
    const response = await fetch(`${nightscoutUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': apiSecret,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nightscout test failed:', response.status, errorText);
      return res.status(401).json({ 
        success: false,
        error: 'Failed to connect to Nightscout. Please check your credentials.' 
      });
    }

    const statusData = await response.json();
    console.log('Nightscout test successful:', statusData);

    return res.status(200).json({ 
      success: true,
      message: 'Nightscout connection verified',
      data: {
        status: statusData.status,
        name: statusData.name,
        version: statusData.version
      }
    });

  } catch (error) {
    console.error('Nightscout test error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to test Nightscout connection'
    });
  }
}