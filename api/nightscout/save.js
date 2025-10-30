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
    const { user_id, entry_type, data } = req.body;

    if (!user_id || !entry_type || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, entry_type, data' 
      });
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

    // Prepare the entry based on type
    let endpoint = '';
    let payload = {};

    if (entry_type === 'glucose') {
      // Save glucose reading as an entry
      endpoint = '/api/v1/entries.json';
      payload = {
        type: 'sgv',
        sgv: data.glucose_value,
        date: new Date(data.timestamp).getTime(),
        dateString: new Date(data.timestamp).toISOString(),
        direction: data.direction || 'Flat',
        device: 'Sentrya',
      };
    } else if (entry_type === 'migraine') {
      // Save migraine as a treatment/note
      endpoint = '/api/v1/treatments.json';
      payload = {
        eventType: 'Note',
        notes: `Migraine: ${data.severity} severity${data.notes ? ' - ' + data.notes : ''}`,
        created_at: new Date(data.timestamp).toISOString(),
        enteredBy: 'Sentrya',
      };
    } else if (entry_type === 'note') {
      // Save general health note
      endpoint = '/api/v1/treatments.json';
      payload = {
        eventType: 'Note',
        notes: data.notes || data.content,
        created_at: new Date(data.timestamp || new Date()).toISOString(),
        enteredBy: 'Sentrya',
      };
    } else {
      return res.status(400).json({ 
        error: 'Invalid entry_type. Must be: glucose, migraine, or note' 
      });
    }

    // Send to Nightscout - api_secret is already hashed in database
    const nsUrl = `${connection.nightscout_url}${endpoint}`;
    const response = await fetch(nsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-SECRET': connection.api_secret, // Already hashed
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Nightscout API error: ${response.status} ${response.statusText}`,
        details: errorText 
      });
    }

    const result = await response.json();

    return res.status(200).json({ 
      success: true,
      message: `${entry_type} saved to Nightscout successfully`,
      nightscout_response: result 
    });

  } catch (error) {
    console.error('Error saving to Nightscout:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}