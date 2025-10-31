// supabase/functions/dexcom-oauth-callback/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      throw new Error('No authorization code received');
    }

    const clientId = Deno.env.get('DEXCOM_CLIENT_ID');
    const clientSecret = Deno.env.get('DEXCOM_CLIENT_SECRET');
    const redirectUri = Deno.env.get('DEXCOM_REDIRECT_URI');
    const apiBase = Deno.env.get('DEXCOM_API_BASE');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${apiBase}/v2/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Get user from JWT token in Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Failed to get user');
    }

    // Store tokens in database (upsert in case reconnecting)
    const { error: dbError } = await supabaseClient
      .from('dexcom_connections')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Redirect back to settings page with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://sentinel-health.vercel.app/settings?dexcom=connected',
      },
    });

  } catch (error) {
    console.error('Dexcom OAuth callback error:', error);
    
    // Redirect back to settings with error
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://sentinel-health.vercel.app/settings?dexcom=error&message=${encodeURIComponent(error.message)}`,
      },
    });
  }
});