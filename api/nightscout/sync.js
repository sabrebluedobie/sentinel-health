// api/nightscout/sync.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production-32ch';
const ALGORITHM = 'aes-256-cbc';

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
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
    const { user_id, days = 7 } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id required' });
    }

    // Get user's Nightscout connection from database
    const { data: connection, error: dbError } = await supabase
      .from('nightscout_connections')
      .select('nightscout_url, encrypted_api_secret')
      .eq('user_id', user_id)
      .single();

    if (dbError || !connection) {
      return res.status(404).json({ 
        success: false, 
        error: 'No Nightscout connection found. Please connect your Nightscout first.' 
      });
    }

    // Decrypt the API secret
    const apiSecret = decrypt(connection.encrypted_api_secret);
    const hashedSecret = crypto.createHash('sha1').update(apiSecret).digest('hex');

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Fetch entries from Nightscout
    const nsUrl = connection.nightscout_url.replace(/\/$/, ''); // Remove trailing slash
    const entriesUrl = `${nsUrl}/api/v1/entries.json?find[dateString][$gte]=${startDate.toISOString()}&count=1000`;

    console.log(`Fetching from Nightscout: ${entriesUrl}`);

    const response = await fetch(entriesUrl, {
      headers: {
        'API-SECRET': hashedSecret,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nightscout API error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false,
        error: 'Failed to fetch from Nightscout',
        details: errorText
      });
    }

    const entries = await response.json();
    console.log(`Fetched ${entries.length} entries from Nightscout`);

    if (entries.length === 0) {
      return res.status(200).json({ 
        success: true,
        synced: 0,
        message: 'No new entries to sync'
      });
    }

    // Transform Nightscout entries to our glucose_readings format
    const glucoseReadings = entries
      .filter(entry => entry.sgv && entry.dateString) // Only entries with glucose values
      .map(entry => ({
        user_id: user_id,
        glucose_value: entry.sgv,
        timestamp: entry.dateString,
        notes: entry.direction || null, // Store trend direction in notes
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

    if (glucoseReadings.length === 0) {
      return res.status(200).json({ 
        success: true,
        synced: 0,
        message: 'No valid glucose readings found'
      });
    }

    // Insert into Supabase (upsert to avoid duplicates)
    const { data: inserted, error: insertError } = await supabase
      .from('glucose_readings')
      .upsert(glucoseReadings, { 
        onConflict: 'user_id,timestamp',
        ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save glucose readings',
        details: insertError.message
      });
    }

    console.log(`Successfully synced ${inserted?.length || glucoseReadings.length} readings`);

    return res.status(200).json({ 
      success: true,
      synced: inserted?.length || glucoseReadings.length,
      message: `Synced ${inserted?.length || glucoseReadings.length} glucose readings from the last ${days} days`
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Sync failed',
      details: error.message 
    });
  }
}