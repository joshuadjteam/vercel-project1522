// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, linting, and type checking.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// FIX: Declare the Deno global to resolve TypeScript errors in environments
// where Deno types are not automatically recognized.
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const payload = await req.json();
    const { action } = payload;

    switch (action) {
      case 'createUser': {
        const { email, password, username, role, sip_voice, features: featuresString } = payload;
        
        // Safely parse the features string
        const features = typeof featuresString === 'string' ? JSON.parse(featuresString) : featuresString;

        // 1. Create the user in the auth system
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true, // Auto-confirm user
        });

        if (authError) throw authError;

        // 2. Create the user profile in the public.users table
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email: email,
            username: username,
            role: role,
            sip_voice: sip_voice,
            features: features,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        return new Response(JSON.stringify({ user: profileData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      case 'deleteUser': {
        const { auth_id } = payload;
        
        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(auth_id);
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ message: `User ${auth_id} deleted successfully.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
