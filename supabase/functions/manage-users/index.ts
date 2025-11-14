
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
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
    const payload = body;
    const { action } = payload;
    
    // Handle public actions that don't need auth first
    if (action === 'getDirectory' || action === 'getUsers') {
        const { data, error } = await supabaseAdmin.from('users').select('*').order('username', { ascending: true });
        if (error) throw error;
        
        return new Response(JSON.stringify({ users: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
    }

    // All actions below require authentication
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    );
    
    const { data: authData, error: authError } = await userClient.auth.getUser();
    const authUser = authData?.user;

    if (authError || !authUser) {
      throw { message: 'Not authenticated', status: 401 };
    }
    
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
    
    switch (action) {
      case 'getUserByUsername': {
        const { username } = payload;
        const { data, error } = await supabaseAdmin.from('users').select('*').eq('username', username).single();
        if (error) throw error;
        return new Response(JSON.stringify({ user: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }
      case 'getUserByEmail': {
        const { email } = payload;
        if (!email) throw { message: 'Email is required.', status: 400 };
        const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found, which is ok
        return new Response(JSON.stringify({ user: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }
      case 'updatePassword': {
        const { newPassword } = payload;
        const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: newPassword });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }
      case 'createUser': {
        await ensureAdmin();
        const { email, password, username, role, sipVoice, features, plan_name } = payload;
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
            plan_name: plan_name,
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
        const { id, auth_id, email, password, username, role, sipVoice, features, plan_name } = payload;
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .update({
            username: username,
            email: email,
            role: role,
            plan_name: plan_name,
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
        if (!auth_id) throw { message: 'auth_id is required for deletion.', status: 400 };

        const { data: userToDelete, error: profileFindError } = await supabaseAdmin
            .from('users')
            .select('username')
            .eq('auth_id', auth_id)
            .single();

        if (profileFindError && profileFindError.code !== 'PGRST116') {
            throw profileFindError;
        }

        if (userToDelete) {
            const username = userToDelete.username;
            await supabaseAdmin.from('contacts').delete().eq('owner', username);
            await supabaseAdmin.from('notes').delete().eq('owner', username);
            await supabaseAdmin.from('mail_accounts').delete().eq('user_id', auth_id);
            await supabaseAdmin.from('users').delete().eq('auth_id', auth_id);
        }

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(auth_id);
        if (authDeleteError) throw authDeleteError;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        throw { message: 'Invalid action specified.', status: 400 };
    }

  } catch (error) {
    console.error("Error in manage-users function:", error);
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred in the edge function.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.status || 500,
    });
  }
});
