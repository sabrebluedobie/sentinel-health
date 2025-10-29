const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { nightscoutUrl, token, entries } = JSON.parse(event.body);

    if (!nightscoutUrl || !token || !entries) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Transform entries to Nightscout format
    const nightscoutEntries = entries.map(entry => ({
      type: entry.type || 'Note',
      eventType: entry.eventType || 'Note',
      date: new Date(entry.timestamp).getTime(),
      created_at: new Date(entry.timestamp).toISOString(),
      notes: entry.notes || '',
      enteredBy: 'Sentinel Health',
      // Add custom fields for migraine tracking
      intensity: entry.intensity,
      triggers: entry.triggers,
      symptoms: entry.symptoms,
      medications: entry.medications,
      relief_methods: entry.reliefMethods,
      duration: entry.duration,
      location: entry.location
    }));

    // Save to Nightscout
    const response = await fetch(`${nightscoutUrl}/api/v1/treatments`, {
      method: 'POST',
      headers: {
        'API-SECRET': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(nightscoutEntries)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to save to Nightscout',
          details: errorText
        })
      };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        saved: result.length || entries.length,
        entries: result
      })
    };

  } catch (error) {
    console.error('Nightscout save error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to save entries',
        details: error.message 
      })
    };
  }
};