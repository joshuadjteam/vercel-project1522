
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
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    );
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) {
      throw { message: 'Not authenticated', status: 401 };
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ensureAdmin = async () => {
      const { data: requestingUserProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('auth_id', authUser.id)
        .single();
      
      if (profileError) throw { message: 'Could not verify user role.', status: 500 };
      if (!requestingUserProfile || requestingUserProfile.role !== 'Admin') {
        throw { message: 'Permission denied: Admin role required.', status: 403 };
      }
    };
    
    const payload = await req.json();
    const { action } = payload;

    switch (action) {
      case 'createUser': {
        await ensureAdmin();
        const { email, password, username, role, sipVoice, features } = payload;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
        });
        if (authError) throw authError;

        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email: email,
            username: username,
            role: role,
            sip_voice: sipVoice,
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
      case 'updateUser': {
        await ensureAdmin();
        const { id, auth_id, email, password, username, role, sipVoice, features } = payload;
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .update({
            username: username,
            email: email,
            role: role,
            sip_voice: sipVoice,
            features: features,
          })
          .eq('id', id)
          .select()
          .single();
        if (profileError) throw profileError;

        if (auth_id && email) {
          const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(auth_id, { email });
          if (authEmailError) throw authEmailError;
        }

        if (auth_id && password) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(auth_id, { password });
          if (authError) throw authError;
        }
        
        return new Response(JSON.stringify({ user: profileData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'deleteUser': {
        await ensureAdmin();
        const { auth_id } = payload;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(auth_id);
        if (error) throw error;

        return new Response(JSON.stringify({ message: `User ${auth_id} deleted successfully.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'getUsers': {
        await ensureAdmin();
        const { data, error } = await supabaseAdmin.from('users').select('*').order('id', { ascending: true });
        if (error) throw error;
        
        return new Response(JSON.stringify({ users: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'getUserByUsername': {
        const { username } = payload;
        if (!username) throw { message: 'Username is required.', status: 400 };

        const { data, error } = await supabaseAdmin.from('users').select('*').eq('username', username).single();
        if (error) {
          if (error.code === 'PGRST116') {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            });
          }
          throw error;
        }
        return new Response(JSON.stringify({ user: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'updatePassword': {
        const { currentPassword, newPassword } = payload;
        // 1. Verify the user's current password by trying to sign in with it.
        const { error: signInError } = await userClient.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword,
        });
        if (signInError) {
          throw { message: 'Incorrect current password.', status: 401 };
        }
        
        // 2. If verification is successful, update the user's password.
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password: newPassword,
        });
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ message: 'Password updated successfully.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        throw { message: 'Invalid action', status: 400 };
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.status || 500,
    });
  }
});