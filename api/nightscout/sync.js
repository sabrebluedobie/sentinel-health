import { createClient } from '@supabase/supabase-js';

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
    const { user_id, days = 7 } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get user's Nightscout connection
    const { data: connection, error: connectionError } = await supabase
      .from('nightscout_connections')
      .select('nightscout_url, api_secret')
      .eq('user_id', user_id)
      .single();

    if (connectionError || !connection) {
      return res.status(404).json({ 
        error: 'No Nightscout connection found for this user' 
      });
    }

    // Calculate date range (last X days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch glucose entries from Nightscout
    const entriesUrl = `${connection.nightscout_url}/api/v1/entries.json?find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${endDate.toISOString()}&count=1000`;
    
    const response = await fetch(entriesUrl, {
      headers: {
        'API-SECRET': connection.api_secret, // Already hashed in database
      },
    });

    if (!response.ok) {
      return res.status(400).json({ 
        error: `Failed to fetch data from Nightscout: ${response.status} ${response.statusText}` 
      });
    }

    const entries = await response.json();

    if (!entries || entries.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No new entries to sync',
        synced: 0 
      });
    }

    // Transform Nightscout entries to Sentrya format
    const glucoseReadings = entries.map(entry => ({
      user_id,
      reading_type: 'glucose',
      glucose_value: entry.sgv, // Sensor glucose value
      timestamp: new Date(entry.dateString || entry.date).toISOString(),
      notes: entry.direction ? `Trend: ${entry.direction}` : null,
      source: 'nightscout_sync',
      created_at: new Date().toISOString(),
    }));

    // Insert glucose readings into Sentrya database
    // Using upsert to avoid duplicates based on user_id + timestamp
    const { data: inserted, error: insertError } = await supabase
      .from('health_readings')
      .upsert(glucoseReadings, {
        onConflict: 'user_id,timestamp',
        ignoreDuplicates: true
      })
      .select();

    if (insertError) {
      console.error('Error inserting glucose readings:', insertError);
      return res.status(500).json({ 
        error: 'Failed to save glucose readings to database',
        details: insertError.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: `Successfully synced ${inserted?.length || 0} glucose readings from Nightscout`,
      synced: inserted?.length || 0,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error syncing Nightscout data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}