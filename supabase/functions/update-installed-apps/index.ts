// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, linting, and type checking.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const createErrorResponse = (message: string, status: number) => {
    console.error(`Update-Installed-Apps Error (Status ${status}):`, message);
    return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status,
    });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return createErrorResponse('This endpoint only accepts POST requests.', 405);
  }

  try {
    // 1. Authenticate the user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return createErrorResponse(authError?.message || 'User not authenticated.', 401);
    }

    // 2. Get the payload
    const { appIds } = await req.json();
    if (!Array.isArray(appIds)) {
      return createErrorResponse('Payload must include an `appIds` array.', 400);
    }

    // 3. Create admin client to perform the update
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Atomically update the user record and select the new data
    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ installed_webly_apps: appIds })
        .eq('auth_id', user.id)
        .select('installed_webly_apps')
        .single();

    if (error) {
      // The .single() method will cause an error if no user is found, which is helpful.
      const errorMessage = error.code === 'PGRST116' 
        ? 'User profile not found during update operation.' 
        : `Database update failed: ${error.message}`;
      return createErrorResponse(errorMessage, error.code === 'PGRST116' ? 404 : 500);
    }

    // 5. Return the confirmed, updated data
    return new Response(JSON.stringify({ installed_webly_apps: data.installed_webly_apps }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });

  } catch (error) {
    return createErrorResponse(error.message || 'An unexpected server error occurred.', error.status || 500);
  }
});
