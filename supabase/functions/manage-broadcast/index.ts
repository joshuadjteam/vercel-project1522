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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body;
    try {
      const bodyText = await req.text();
      // Safely parse the body, defaulting to an empty object if the body is empty.
      body = JSON.parse(bodyText || '{}');
    } catch (e) {
      // If parsing fails, it's a bad request.
      throw { status: 400, message: `Invalid JSON in request body: ${e.message}` };
    }
    // Ensure the parsed body is a non-null object before proceeding.
    if (typeof body !== 'object' || body === null) {
      throw { status: 400, message: 'Request body must be a JSON object.' };
    }
    const { action, payload } = body;

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Public endpoint: get broadcast message. No auth required.
    if (action === 'get') {
        const { data: message, error: msgError } = await supabaseAdmin
            .from('system_broadcast')
            .select('message, is_active')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        // PGRST116 means no rows found, which is not an error in this case.
        if (msgError && msgError.code !== 'PGRST116') throw msgError; 
        
        return new Response(JSON.stringify({ message: message || null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // Admin endpoints: require authentication and admin role.
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });

    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) throw { message: 'User not authenticated', status: 401 };
    
    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('role').eq('auth_id', authUser.id).single();
    if (profileError || !userProfile) throw { message: 'User profile not found', status: 404 };
    if (userProfile.role !== 'Admin') throw { message: 'Permission denied: Admin role required.', status: 403 };

    switch(action){
      case 'set': {
        const { message } = payload;
        if (!message) throw { message: 'Message content is required', status: 400 };

        // Deactivate any currently active message.
        await supabaseAdmin.from('system_broadcast').update({ is_active: false }).eq('is_active', true);
        
        // Insert the new active message.
        const { error: insertError } = await supabaseAdmin.from('system_broadcast').insert({ message: message, is_active: true });
        if (insertError) throw insertError;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      case 'deactivate': {
        const { error: updateError } = await supabaseAdmin.from('system_broadcast').update({ is_active: false }).eq('is_active', true);
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      default:
        throw { message: `Unknown action: '${action}'`, status: 400 };
    }

  } catch (error) {
    console.error("Error in manage-broadcast function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the edge function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.status || 500,
    });
  }
});