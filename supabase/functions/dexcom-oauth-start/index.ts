// supabase/functions/dexcom-oauth-start/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const clientId = Deno.env.get('DEXCOM_CLIENT_ID');
    const redirectUri = Deno.env.get('DEXCOM_REDIRECT_URI');
    const apiBase = Deno.env.get('DEXCOM_API_BASE');

    if (!clientId || !redirectUri || !apiBase) {
      throw new Error('Missing Dexcom environment variables');
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();

    // Build Dexcom OAuth authorization URL
    const authUrl = new URL(`${apiBase}/v2/oauth2/login`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'offline_access');
    authUrl.searchParams.append('state', state);

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state: state 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});