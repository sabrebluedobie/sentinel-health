// netlify/functions/dexcom-sync.js
// Syncs glucose readings from Dexcom Clarity API

const { createClient } = require('@supabase/supabase-js');

const DEXCOM_API_BASE = 'https://api.dexcom.com/v2/users/self';
const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET;
const DEXCOM_TOKEN_URL = 'https://api.dexcom.com/v2/oauth2/token';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Refresh access token if needed
 */
async function refreshAccessToken(refreshToken) {
  const response = await fetch(DEXCOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: DEXCOM_CLIENT_ID,
      client_secret: DEXCOM_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Fetch glucose readings from Dexcom (EGVs - Estimated Glucose Values)
 */
async function fetchGlucoseReadings(accessToken, startDate, endDate) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(`${DEXCOM_API_BASE}/egvs?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dexcom API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.egvs || data.records || []; // Handle different response formats
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { user_id, days = 7, start_date, end_date } = JSON.parse(event.body || '{}');

    if (!user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'user_id is required' }),
      };
    }

    // Get user's Dexcom connection
    const { data: connection, error: connError } = await supabase
      .from('dexcom_connections')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (connError || !connection) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Dexcom not connected' }),
      };
    }

    let accessToken = connection.access_token;
    let refreshToken = connection.refresh_token;

    // Check if token needs refresh (expires within 1 hour)
    const expiresAt = new Date(connection.token_expires_at);
    const needsRefresh = expiresAt < new Date(Date.now() + 3600000); // 1 hour buffer

    if (needsRefresh) {
      console.log('[Dexcom Sync] Refreshing access token');
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;

      // Update tokens in database
      const newExpiresAt = new Date(Date.now() + (refreshed.expiresIn * 1000)).toISOString();
      await supabase
        .from('dexcom_connections')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: newExpiresAt,
        })
        .eq('user_id', user_id);
    }

    // Calculate date range
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    console.log('[Dexcom Sync] Fetching readings from', startDate, 'to', endDate);

    // Fetch glucose readings from Dexcom
    const readings = await fetchGlucoseReadings(accessToken, startDate, endDate);

    console.log(`[Dexcom Sync] Received ${readings.length} readings`);

    // Transform to our schema and insert
    const glucoseRecords = readings.map(reading => ({
      user_id,
      device_time: reading.systemTime, // Dexcom's timestamp
      value_mgdl: reading.value,
      trend: reading.trend || reading.trendArrow, // 'rising', 'falling', etc.
      source: 'dexcom',
      external_id: reading.recordId || reading.systemTime, // For deduplication
      created_at: new Date().toISOString(),
    }));

    // Insert readings (upsert to avoid duplicates)
    let inserted = 0;
    if (glucoseRecords.length > 0) {
      // Insert in batches of 500 (Supabase limit)
      const batchSize = 500;
      for (let i = 0; i < glucoseRecords.length; i += batchSize) {
        const batch = glucoseRecords.slice(i, i + batchSize);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('glucose_readings')
          .upsert(batch, {
            onConflict: 'external_id', // Don't insert duplicates
            ignoreDuplicates: true,
          })
          .select();

        if (insertError) {
          console.error('[Dexcom Sync] Insert error:', insertError);
          throw insertError;
        }

        inserted += insertedData?.length || 0;
      }
    }

    // Update last sync time
    await supabase
      .from('dexcom_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user_id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Sync completed successfully',
        synced: inserted,
        total_readings: readings.length,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }),
    };

  } catch (error) {
    console.error('[Dexcom Sync] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Sync failed',
        details: error.message,
      }),
    };
  }
};
