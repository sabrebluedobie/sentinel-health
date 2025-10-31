// supabase/functions/dexcom-sync/index.ts
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
    // Get user from JWT token
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

    // Get Dexcom connection for this user
    const { data: connection, error: connError } = await supabaseClient
      .from('dexcom_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      throw new Error('No Dexcom connection found. Please connect your Dexcom account first.');
    }

    // Check if token is expired and refresh if needed
    let accessToken = connection.access_token;
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();

    if (now >= expiresAt) {
      // Token expired, refresh it
      const apiBase = Deno.env.get('DEXCOM_API_BASE');
      const clientId = Deno.env.get('DEXCOM_CLIENT_ID');
      const clientSecret = Deno.env.get('DEXCOM_CLIENT_SECRET');

      const refreshResponse = await fetch(`${apiBase}/v2/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

      // Update stored tokens
      await supabaseClient
        .from('dexcom_connections')
        .update({
          access_token: accessToken,
          refresh_token: refreshData.refresh_token,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Fetch glucose data from Dexcom (last 24 hours)
    const apiBase = Deno.env.get('DEXCOM_API_BASE');
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    const dataUrl = new URL(`${apiBase}/v3/users/self/egvs`);
    dataUrl.searchParams.append('startDate', startTime.toISOString());
    dataUrl.searchParams.append('endDate', endTime.toISOString());

    const dataResponse = await fetch(dataUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      throw new Error(`Failed to fetch glucose data: ${errorText}`);
    }

    const glucoseData = await dataResponse.json();

    // Insert glucose readings into health_readings table
    let insertedCount = 0;
    
    if (glucoseData.records && glucoseData.records.length > 0) {
      const readings = glucoseData.records.map((record: any) => ({
        user_id: user.id,
        created_at: record.systemTime || record.displayTime,
        value: record.value,
        unit: 'mg/dL',
        source: 'dexcom',
        type: 'glucose',
        raw: {
          trend: record.trend,
          trendRate: record.trendRate,
          recordId: record.recordId,
        },
      }));

      // Insert in batches to avoid conflicts (use upsert based on created_at + user_id)
      for (const reading of readings) {
        const { error: insertError } = await supabaseClient
          .from('health_readings')
          .upsert(reading, {
            onConflict: 'user_id,created_at',
            ignoreDuplicates: true,
          });

        if (!insertError) {
          insertedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Synced ${insertedCount} glucose readings from Dexcom`,
        totalRecords: glucoseData.records?.length || 0,
        insertedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Dexcom sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});