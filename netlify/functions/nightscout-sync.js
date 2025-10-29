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
    const { nightscoutUrl, token, lastSyncDate } = JSON.parse(event.body);

    if (!nightscoutUrl || !token) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing nightscoutUrl or token' })
      };
    }

    // Build query parameters
    let queryParams = 'count=1000'; // Get up to 1000 entries
    
    if (lastSyncDate) {
      const syncTime = new Date(lastSyncDate).getTime();
      queryParams += `&find[created_at][$gte]=${new Date(syncTime).toISOString()}`;
    }

    // Fetch treatments from Nightscout
    const response = await fetch(`${nightscoutUrl}/api/v1/treatments?${queryParams}`, {
      headers: {
        'API-SECRET': token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to fetch from Nightscout',
          details: await response.text()
        })
      };
    }

    const treatments = await response.json();

    // Filter for Sentinel Health entries and transform back to app format
    const sentinelEntries = treatments
      .filter(t => t.enteredBy === 'Sentinel Health' || t.eventType === 'Note')
      .map(treatment => ({
        id: treatment._id,
        timestamp: treatment.created_at,
        date: new Date(treatment.created_at).toISOString().split('T')[0],
        time: new Date(treatment.created_at).toTimeString().split(' ')[0].substring(0, 5),
        intensity: treatment.intensity || 0,
        triggers: treatment.triggers || [],
        symptoms: treatment.symptoms || [],
        medications: treatment.medications || [],
        reliefMethods: treatment.relief_methods || [],
        duration: treatment.duration || '',
        location: treatment.location || '',
        notes: treatment.notes || '',
        nightscoutId: treatment._id,
        syncedAt: new Date().toISOString()
      }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        entries: sentinelEntries,
        count: sentinelEntries.length,
        lastSync: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Nightscout sync error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Sync failed',
        details: error.message 
      })
    };
  }
};