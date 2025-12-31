// netlify/functions/dexcom-oauth-callback.js
// Handles Dexcom OAuth callback and exchanges code for tokens

const { createClient } = require('@supabase/supabase-js');

const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET;
const DEXCOM_REDIRECT_URI = process.env.DEXCOM_REDIRECT_URI || 'https://sentrya.com/api/dexcom/callback';
const DEXCOM_TOKEN_URL = 'https://api.dexcom.com/v2/oauth2/token';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { code, user_id } = JSON.parse(event.body || '{}');

    if (!code || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'code and user_id are required' }),
      };
    }

    if (!DEXCOM_CLIENT_ID || !DEXCOM_CLIENT_SECRET) {
      console.error('[Dexcom] OAuth credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Dexcom integration not configured' }),
      };
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(DEXCOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_id: DEXCOM_CLIENT_ID,
        client_secret: DEXCOM_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: DEXCOM_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Dexcom] Token exchange failed:', errorText);
      return {
        statusCode: tokenResponse.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to exchange authorization code',
          details: errorText,
        }),
      };
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_in, // seconds until expiration
    } = tokenData;

    if (!access_token || !refresh_token) {
      console.error('[Dexcom] Missing tokens in response:', tokenData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Invalid token response from Dexcom' }),
      };
    }

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

    // Store tokens in database
    const { data: connection, error: dbError } = await supabase
      .from('dexcom_connections')
      .upsert({
        user_id,
        access_token, // In production, encrypt these!
        refresh_token,
        token_expires_at: expiresAt,
        last_sync_at: null,
        sync_enabled: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Dexcom] Database error:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to save connection',
          details: dbError.message,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Successfully connected to Dexcom',
        connection: {
          user_id: connection.user_id,
          token_expires_at: connection.token_expires_at,
          sync_enabled: connection.sync_enabled,
        },
      }),
    };

  } catch (error) {
    console.error('[Dexcom Callback] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'OAuth callback failed',
        details: error.message,
      }),
    };
  }
};
