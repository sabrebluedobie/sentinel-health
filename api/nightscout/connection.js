// api/nightscout/connection.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Encryption setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production-32ch';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

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

    // Hash the API secret to test the connection
    const hashedSecret = crypto
      .createHash('sha1')
      .update(api_secret)
      .digest('hex');

    // Test the Nightscout connection
    console.log(`Testing connection to: ${cleanUrl}/api/v1/status`);
    const response = await fetch(`${cleanUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': hashedSecret,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Nightscout test failed:', response.status, await response.text());
      return res.status(401).json({ 
        success: false,
        error: 'Invalid Nightscout URL or API Secret. Please check your credentials.' 
      });
    }

    const status = await response.json();
    console.log('Nightscout connection successful:', status.name, status.version);

    // Encrypt the API secret for storage
    const encryptedSecret = encrypt(api_secret);

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('nightscout_connections')
      .select('id')
      .eq('user_id', user_id)
      .single();

    let data, dbError;

    if (existing) {
      // Update existing connection
      const result = await supabase
        .from('nightscout_connections')
        .update({
          nightscout_url: cleanUrl,
          encrypted_api_secret: encryptedSecret,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select()
        .single();
      
      data = result.data;
      dbError = result.error;
    } else {
      // Insert new connection
      const result = await supabase
        .from('nightscout_connections')
        .insert({
          user_id: user_id,
          nightscout_url: cleanUrl,
          encrypted_api_secret: encryptedSecret
        })
        .select()
        .single();
      
      data = result.data;
      dbError = result.error;
    }

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save connection to database',
        details: dbError.message 
      });
    }

    console.log('Connection saved to database for user:', user_id);

    return res.status(200).json({ 
      success: true,
      connection: {
        nightscout_url: cleanUrl,
        server_name: status.name || 'Nightscout',
        version: status.version
      }
    });

  } catch (error) {
    console.error('Connection error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Connection failed',
      details: error.message 
    });
  }
}