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
    
    const payload = await req.json();
    const { action } = payload;
    
    const normalizeEmail = (email: any) => {
        if (typeof email !== 'string') return null;
        return email.trim().toLowerCase();
    };

    // Public actions
    if (action === 'getDirectory' || action === 'getUsers') {
        const { data, error } = await supabaseAdmin.from('users').select('id, auth_id, username, email, role, features').order('username', { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify({ users: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'getUserByUsername') {
        const { username } = payload;
        const { data, error } = await supabaseAdmin.from('users').select('id, auth_id, username, email, role, features').eq('username', username).single();
        if (error && error.code !== 'PGRST116') throw error;
        return new Response(JSON.stringify({ user: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'getUserByEmail') {
        const email = normalizeEmail(payload.email);
        if (!email) throw { message: 'A valid email string is required.', status: 400 };
        const { data, error } = await supabaseAdmin.from('users').select('id, auth_id, username, email, role, features').ilike('email', email).limit(1);
        if (error) throw error; 
        return new Response(JSON.stringify({ user: data?.[0] || null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Authenticated actions
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    );
    
    const { data: authData, error: authError } = await userClient.auth.getUser();
    const authUser = authData?.user;
    if (authError || !authUser) throw { message: 'Not authenticated', status: 401 };
    
    // For normal user updates (like system update), we allow the user to update themselves or Admin to update others.
    // But for managing permissions/roles, we strictly check Admin.
    
    // Check requesting user role
    const { data: requestingUserProfile, error: profileError } = await supabaseAdmin.from('users').select('role').eq('auth_id', authUser.id).single();
    const isAdmin = requestingUserProfile?.role === 'Admin';
    
    switch (action) {
      case 'updatePassword': {
        const { newPassword } = payload;
        const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: newPassword });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      case 'createUser': {
        if (!isAdmin) throw { message: 'Permission denied: Admin role required.', status: 403 };
        const { password, username, role, features } = payload;
        const email = normalizeEmail(payload.email);
        if (!email) throw { status: 400, message: 'A valid email is required.' };

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
        if (authError) throw authError;

        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email,
            username,
            role,
            features
          })
          .select()
          .single();
        if (profileError) throw profileError;

        return new Response(JSON.stringify({ user: profileData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      case 'updateUser': {
        // Allow user to update their own system version or Admin to update anyone
        const { id, auth_id, password, username, role, features, system_version } = payload;
        
        // If target ID is different from authenticated user ID, require Admin
        // We need to verify if 'id' (public table id) corresponds to 'authUser.id' (auth table id)
        // But since we pass both usually, we check auth_id if present.
        const targetAuthId = auth_id;
        
        if (targetAuthId && targetAuthId !== authUser.id && !isAdmin) {
             throw { message: 'Permission denied: Cannot update other users.', status: 403 };
        }
        
        const email = normalizeEmail(payload.email);
        
        // Public Profile Update
        let updatePayload: Record<string, any> = {};
        if (username) updatePayload.username = username;
        if (role && isAdmin) updatePayload.role = role; // Only admin can change roles
        if (features && isAdmin) updatePayload.features = features;
        if (email) updatePayload.email = email;

        let profileData = null;
        if (Object.keys(updatePayload).length > 0) {
            const { data, error: profileError } = await supabaseAdmin.from('users').update(updatePayload).eq('id', id).select().single();
            if (profileError) throw profileError;
            profileData = data;
        } else {
             // Fetch existing if not updating public profile to return consistent shape
             const { data } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
             profileData = data;
        }

        // Auth User Update (Email, Password, Metadata)
        let authUpdatePayload: any = {};
        if (email) authUpdatePayload.email = email;
        if (password) authUpdatePayload.password = password;
        
        // Handle System Version Update in Metadata
        if (system_version) {
            // Fetch current metadata first to merge
            const { data: currentUserData } = await supabaseAdmin.auth.admin.getUserById(targetAuthId || authUser.id);
            const currentMeta = currentUserData?.user?.app_metadata || {};
            authUpdatePayload.app_metadata = { ...currentMeta, system_version };
        }

        if (Object.keys(authUpdatePayload).length > 0 && (targetAuthId || authUser.id)) {
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(targetAuthId || authUser.id, authUpdatePayload);
          if (authUpdateError) throw authUpdateError;
        }
        
        // Return profile with injected system_version if updated
        if (profileData && system_version) {
            profileData.system_version = system_version;
        }
        
        return new Response(JSON.stringify({ user: profileData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      case 'deleteUser': {
        if (!isAdmin) throw { message: 'Permission denied: Admin role required.', status: 403 };
        const { auth_id } = payload;
        if (!auth_id) throw { message: 'auth_id is required for deletion.', status: 400 };

        const { data: userToDelete, error: profileFindError } = await supabaseAdmin.from('users').select('username').eq('auth_id', auth_id).single();
        if (profileFindError && profileFindError.code !== 'PGRST116') throw profileFindError;

        if (userToDelete) {
            const username = userToDelete.username;
            await supabaseAdmin.from('contacts').delete().eq('owner', username);
            await supabaseAdmin.from('notes').delete().eq('owner', username);
            await supabaseAdmin.from('mail_accounts').delete().eq('user_id', auth_id);
            await supabaseAdmin.from('users').delete().eq('auth_id', auth_id);
        }

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(auth_id);
        if (authDeleteError) throw authDeleteError;
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      default:
        throw { message: 'Invalid action specified.', status: 400 };
    }

  } catch (error) {
    console.error("Error in manage-users function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the edge function.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error.status || 500 });
  }
});