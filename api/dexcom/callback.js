// api/dexcom/callback.js
// Vercel API Route - Dexcom OAuth callback (GET redirect) + optional POST support

import { createClient } from '@supabase/supabase-js';

const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET;

// Must EXACTLY match what you registered in Dexcom developer portal
const DEXCOM_REDIRECT_URI =
  process.env.DEXCOM_REDIRECT_URI || 'https://sentrya.vercel.app/api/dexcom/callback';

const DEXCOM_TOKEN_URL = 'https://api.dexcom.com/v2/oauth2/token';

// Where to send the user after connect attempt
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://sentrya.vercel.app';
const SUCCESS_REDIRECT = `${APP_BASE_URL}/settings?dexcom=connected`;
const ERROR_REDIRECT = `${APP_BASE_URL}/settings?dexcom=error`;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function safeRedirect(res, url) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}

export default async function handler(req, res) {
  // Dexcom callback does NOT need CORS for browser redirects,
  // but leaving these is fine.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Dexcom will call this route with GET.
  // We allow POST too (for manual/testing flows).
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!DEXCOM_CLIENT_ID || !DEXCOM_CLIENT_SECRET) {
      console.error('[Dexcom] Missing client credentials');
      return safeRedirect(res, `${ERROR_REDIRECT}&reason=missing_credentials`);
    }

    // Dexcom redirect arrives as GET with query params.
    // POST is optional for manual calls.
    const code = req.method === 'GET' ? req.query.code : req.body?.code;
    const state = req.method === 'GET' ? req.query.state : req.body?.state;
    const postedUserId = req.method === 'POST' ? req.body?.user_id : null;

    if (!code) {
      return safeRedirect(res, `${ERROR_REDIRECT}&reason=missing_code`);
    }

    // Resolve user_id:
    // Priority:
    //  1) POST body user_id (manual/testing)
    //  2) dexcom_oauth_states lookup (best practice)
    //  3) fallback: treat state as user_id (your current shortcut)
    let resolvedUserId = postedUserId || null;

    if (!resolvedUserId) {
      if (!state) {
        return safeRedirect(res, `${ERROR_REDIRECT}&reason=missing_state`);
      }

      // Attempt best-practice mapping: dexcom_oauth_states(state -> user_id)
      // If you don't have this table yet, it'll error; we fall back to state=user_id.
      try {
        const { data: stateRow, error: stateErr } = await supabase
          .from('dexcom_oauth_states')
          .select('user_id')
          .eq('state', state)
          .single();

        if (!stateErr && stateRow?.user_id) {
          resolvedUserId = stateRow.user_id;

          // One-time use (recommended)
          await supabase.from('dexcom_oauth_states').delete().eq('state', state);
        }
      } catch (e) {
        // ignore and fall back
      }

      // Fallback shortcut: state is user_id
      if (!resolvedUserId) {
        resolvedUserId = String(state);
      }
    }

    if (!resolvedUserId) {
      return safeRedirect(res, `${ERROR_REDIRECT}&reason=missing_user`);
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
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: DEXCOM_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Dexcom] Token exchange failed:', tokenResponse.status, errorText);
      return safeRedirect(res, `${ERROR_REDIRECT}&reason=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token || !refresh_token || !expires_in) {
      console.error('[Dexcom] Invalid token response:', tokenData);
      return safeRedirect(res, `${ERROR_REDIRECT}&reason=invalid_token_response`);
    }

    const expiresAt = new Date(Date.now() + Number(expires_in) * 1000).toISOString();

    // Store tokens
    const { error: dbError } = await supabase
      .from('dexcom_connections')
      .upsert(
        {
          user_id: resolvedUserId,
          access_token,    // TODO: encrypt at rest in production
          refresh_token,   // TODO: encrypt at rest in production
          token_expires_at: expiresAt,
          last_sync_at: null,
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (dbError) {
      console.error('[Dexcom] Database error:', dbError);
      return safeRedirect(res, `${ERROR_REDIRECT}&reason=db_error`);
    }

    // Success: redirect user back to app
    return safeRedirect(res, SUCCESS_REDIRECT);
  } catch (error) {
    console.error('[Dexcom Callback] Error:', error);
    return safeRedirect(res, `${ERROR_REDIRECT}&reason=exception`);
  }
}
