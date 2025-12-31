// netlify/functions/dexcom-oauth-authorize.js
// Initiates Dexcom OAuth flow

const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
const DEXCOM_REDIRECT_URI = process.env.DEXCOM_REDIRECT_URI || 'https://sentrya.com/api/dexcom/callback';
const DEXCOM_AUTH_URL = 'https://api.dexcom.com/v2/oauth2/login';

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
    const { user_id } = JSON.parse(event.body || '{}');

    if (!user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'user_id is required' }),
      };
    }

    if (!DEXCOM_CLIENT_ID) {
      console.error('[Dexcom] DEXCOM_CLIENT_ID not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Dexcom integration not configured' }),
      };
    }

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: DEXCOM_CLIENT_ID,
      redirect_uri: DEXCOM_REDIRECT_URI,
      response_type: 'code',
      scope: 'offline_access', // Request refresh token
      state: user_id, // Pass user_id in state for callback
    });

    const authUrl = `${DEXCOM_AUTH_URL}?${params.toString()}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        authUrl,
        message: 'Redirect to this URL to authorize',
      }),
    };

  } catch (error) {
    console.error('[Dexcom OAuth] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to start OAuth flow',
        details: error.message,
      }),
    };
  }
};
