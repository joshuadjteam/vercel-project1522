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

    // 3. Create admin client
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Log app activity
    const currentAppIds = user.app_metadata?.installed_webly_apps || [];
    const newAppIdsSet = new Set(appIds);
    const currentAppIdsSet = new Set(currentAppIds);

    const toInstall = appIds.filter(id => !currentAppIdsSet.has(id));
    const toUninstall = currentAppIds.filter(id => !newAppIdsSet.has(id));

    const logs: { user_id: string; app_id: string; action: 'install' | 'uninstall' }[] = [];
    toInstall.forEach(appId => logs.push({ user_id: user.id, app_id: appId, action: 'install' }));
    toUninstall.forEach(appId => logs.push({ user_id: user.id, app_id: appId, action: 'uninstall' }));
    
    if (logs.length > 0) {
        const { error: logError } = await supabaseAdmin.from('app_activity_log').insert(logs);
        if (logError) {
          // Log the error but don't block the main operation
          console.error("Failed to log app activity:", logError.message);
        }
    }

    // 5. Update the user's app_metadata in the auth schema
    const { data: updatedUserData, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { app_metadata: { installed_webly_apps: appIds } }
    );

    if (error) {
        return createErrorResponse(`Auth metadata update failed: ${error.message}`, 500);
    }

    const updatedApps = updatedUserData.user?.app_metadata?.installed_webly_apps || [];

    // 6. Return the confirmed, updated data
    return new Response(JSON.stringify({ installed_webly_apps: updatedApps }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });

  } catch (error) {
    return createErrorResponse(error.message || 'An unexpected server error occurred.', error.status || 500);
  }
});