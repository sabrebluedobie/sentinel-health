// api/dexcom/authorize.js
// Initiates Dexcom OAuth flow (Vercel serverless function)

const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
const DEXCOM_REDIRECT_URI = process.env.DEXCOM_REDIRECT_URI || 'https://sentrya.com/api/dexcom/callback';
const DEXCOM_AUTH_URL = 'https://api.dexcom.com/v2/oauth2/login';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!DEXCOM_CLIENT_ID) {
      console.error('[Dexcom] DEXCOM_CLIENT_ID not configured');
      return res.status(500).json({ error: 'Dexcom integration not configured' });
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

    return res.status(200).json({ 
      authUrl,
      message: 'Redirect to this URL to authorize',
    });

  } catch (error) {
    console.error('[Dexcom OAuth] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to start OAuth flow',
      details: error.message,
    });
  }
}
