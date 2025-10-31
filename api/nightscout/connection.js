// api/nightscout/connection.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { nightscout_url, api_secret, user_id } = req.body;

    if (!nightscout_url || !api_secret || !user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: nightscout_url, api_secret, user_id' 
      });
    }

    // Clean up the URL (remove trailing slash)
    const cleanUrl = nightscout_url.replace(/\/$/, '');

    // Hash the API secret for storage and testing
    const hashedSecret = crypto
      .createHash('sha1')
      .update(api_secret)
      .digest('hex');

    // Test the Nightscout connection first
    console.log(`Testing connection to: ${cleanUrl}/api/v1/status`);
    
    const testResponse = await fetch(`${cleanUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': hashedSecret,
        'Accept': 'application/json'
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Nightscout test failed:', testResponse.status, errorText);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid Nightscout URL or API Secret. Please check your credentials.'
      });
    }

    const statusData = await testResponse.json();
    console.log('Nightscout connection successful:', statusData.status);

    // Connection test passed - now SAVE to database
    // Using correct column names: url, api_secret (not nightscout_url)
    console.log(`Saving connection for user: ${user_id}`);
    
    const { data: savedConnection, error: saveError } = await supabase
      .from('nightscout_connections')
      .upsert({
        user_id: user_id,
        url: cleanUrl,  // Changed from nightscout_url to url
        api_secret: hashedSecret,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      return res.status(500).json({ 
        success: false,
        error: `Failed to save connection: ${saveError.message}` 
      });
    }

    console.log('Connection saved successfully:', savedConnection);

    return res.status(200).json({ 
      success: true,
      message: 'Nightscout connection saved successfully',
      data: {
        id: savedConnection.id,
        url: savedConnection.url,
        updated_at: savedConnection.updated_at
      }
    });

  } catch (error) {
    console.error('Nightscout connection error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to save Nightscout connection'
    });
  }
}