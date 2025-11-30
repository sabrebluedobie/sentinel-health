// api/nightscout/sync.js
import { createClient } from '@supabase/supabase-js';

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
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing user_id parameter' 
      });
    }

    console.log(`Syncing Nightscout data for user: ${user_id}`);

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
        error: 'No Nightscout connection found. Please connect your Nightscout first.' 
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

    console.log(`Fetching entries from: ${nightscoutUrl}/api/v1/entries.json`);

    // Fetch glucose entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const response = await fetch(
      `${nightscoutUrl}/api/v1/entries.json?find[dateString][$gte]=${sevenDaysAgo.toISOString()}&count=1000`,
      {
        headers: {
          'API-SECRET': apiSecret,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nightscout fetch failed:', response.status, errorText);
      return res.status(502).json({ 
        success: false,
        error: 'Failed to fetch data from Nightscout' 
      });
    }

    const entries = await response.json();
    console.log(`Fetched ${entries.length} entries from Nightscout`);

    if (entries.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No new entries to sync',
        synced: 0
      });
    }

    // Transform entries to match YOUR actual schema
    // Removing reading_type to avoid constraint violation
    const glucoseReadings = entries.map(entry => ({
      user_id: user_id,
      value_mgdl: entry.sgv,
      device_time: new Date(entry.
       dateString || entry.date).toISOString(),
      reading_type: 'libre', // or 'fingerstick' based on your logic
      source: 'nightscout',
      trend: entry.direction || null,
      note: entry.direction ? `Direction: ${entry.direction}` : null,
      nightscout_id: entry._id
    }));

    // Use upsert to avoid duplicates based on nightscout_id
    const { data: insertedData, error: insertError } = await supabase
      .from('glucose_readings')
      .upsert(glucoseReadings, {
        onConflict: 'nightscout_id',
        ignoreDuplicates: true
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ 
        success: false,
        error: `Failed to save glucose readings: ${insertError.message}` 
      });
    }

    // Update last_sync timestamp
    await supabase
      .from('nightscout_connections')
      .update({ 
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    console.log(`Successfully synced ${entries.length} glucose readings`);

    return res.status(200).json({ 
      success: true,
      message: 'Glucose data synced successfully',
      synced: entries.length
    });

  } catch (error) {
    console.error('Nightscout sync error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to sync Nightscout data'
    });
  }
}