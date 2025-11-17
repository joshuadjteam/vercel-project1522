import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // This client is used to verify the JWT and get the user.
    // It uses the anon key, but the Authorization header from the incoming request will authenticate the call.
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data, error: authError } = await supabaseClient.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Authentication error: Invalid JWT.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    // This client uses the service role key to bypass RLS.
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Fetch the user's profile from the public.users table.
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*') // No longer selecting the non-existent 'installed_webly_apps' column
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      // PGRST116 indicates that the query returned no rows, which means no profile was found.
      if (profileError.code === 'PGRST116') {
        return new Response(JSON.stringify({
          error: `Profile not found for user ${user.id}`
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 404
        });
      }
      // For other database errors, throw them to be caught by the generic error handler.
      throw profileError;
    }
    
    // Combine the public profile data with the app metadata from the auth user object.
    const combinedProfile = {
      ...profileData,
      installed_webly_apps: user.app_metadata?.installed_webly_apps || [],
    };

    // Return the combined profile data.
    return new Response(JSON.stringify({
      user: combinedProfile
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});