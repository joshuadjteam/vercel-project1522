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
serve(async (req)=>{
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // This client authenticates the request and gets the auth user
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({
        error: 'Not authenticated'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // This client uses the service role key for admin operations
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const payload = await req.json();
    const { action } = payload;
    // Fetch the profile of the user making the request to check their role.
    // This is required for all admin actions.
    if (action !== 'getUserByUsername') {
      const { data: requestingUserProfile, error: profileError } = await supabaseAdmin.from('users').select('role').eq('auth_id', authUser.id).single();
      if (profileError) {
        return new Response(JSON.stringify({
          error: 'Could not verify user role.'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (requestingUserProfile.role !== 'Admin') {
        return new Response(JSON.stringify({
          error: 'Permission denied: Admin role required.'
        }), {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    switch(action){
      case 'createUser':
        {
          const { email, password, username, role, sipVoice, features } = payload;
          // 1. Create the user in the auth system
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
          });
          if (authError) throw authError;
          // 2. Create the user profile in the public.users table
          const { data: profileData, error: profileError } = await supabaseAdmin.from('users').insert({
            auth_id: authData.user.id,
            email: email,
            username: username,
            role: role,
            sip_voice: sipVoice,
            features: features
          }).select().single();
          if (profileError) throw profileError;
          return new Response(JSON.stringify({
            user: profileData
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'updateUser':
        {
          const { id, auth_id, email, password, username, role, sipVoice, features } = payload;
          // 1. Update user profile in public.users table
          const { data: profileData, error: profileError } = await supabaseAdmin.from('users').update({
            username: username,
            email: email,
            role: role,
            sip_voice: sipVoice,
            features: features
          }).eq('id', id).select().single();
          if (profileError) throw profileError;
          // 2. If auth_id and email are provided, update email in the auth system
          if (auth_id && email) {
            const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(auth_id, {
              email: email
            });
            if (authEmailError) throw authEmailError;
          }
          // 3. If password and auth_id are provided, update it in the auth system
          if (auth_id && password) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(auth_id, {
              password: password
            });
            if (authError) throw authError;
          }
          return new Response(JSON.stringify({
            user: profileData
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'deleteUser':
        {
          const { auth_id } = payload;
          // Deleting the auth user will cascade and delete the public user profile
          // due to the foreign key constraint with ON DELETE CASCADE.
          const { data, error } = await supabaseAdmin.auth.admin.deleteUser(auth_id);
          if (error) throw error;
          return new Response(JSON.stringify({
            message: `User ${auth_id} deleted successfully.`
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'getUsers':
        {
          const { data, error } = await supabaseAdmin.from('users').select('*').order('id', {
            ascending: true
          });
          if (error) throw error;
          return new Response(JSON.stringify({
            users: data
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'getUserByUsername':
        {
          const { username } = payload;
          if (!username) throw new Error('Username is required.');
          const { data, error } = await supabaseAdmin.from('users').select('*').eq('username', username).single();
          if (error) {
            // Specifically handle not found case to return 404
            if (error.code === 'PGRST116') {
              return new Response(JSON.stringify({
                error: 'User not found'
              }), {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                },
                status: 404
              });
            }
            throw error;
          }
          return new Response(JSON.stringify({
            user: data
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      default:
        return new Response(JSON.stringify({
          error: 'Invalid action'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
    }
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
