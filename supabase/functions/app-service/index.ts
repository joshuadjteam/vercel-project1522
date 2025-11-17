import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let resource, action, payload;

    // Handle GET requests by parsing URL params, handle POST by parsing body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      resource = url.searchParams.get('resource');
      action = url.searchParams.get('action');
      // payload is not used for GET in this app
    } else {
      const body = await req.json().catch(() => ({}));
      ({ resource, action, payload } = body as any);
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Public endpoints that do not require auth ---
    if (resource === 'drive' && action === 'get-oauth-config') {
        const clientId = Deno.env.get('GCP_CLIENT_ID');
        const redirectUri = Deno.env.get('GCP_REDIRECT_URI');
        if (!clientId || !redirectUri) throw { status: 500, message: 'Google OAuth is not configured on the server.' };
        return new Response(JSON.stringify({ clientId, redirectUri }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (resource === 'auth' && action === 'loginAndLinkDrive') {
        const { email, password, code } = payload;
        if (!email || !password || !code) throw { status: 400, message: 'Email, password, and authorization code are required.' };

        const authClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
        const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
        if (signInError) throw { status: 401, message: 'Authentication failed: Invalid credentials.' };
        const authUser = signInData.user;
        if (!authUser) throw { status: 401, message: 'Authentication failed.' };

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: Deno.env.get('GCP_CLIENT_ID'),
                client_secret: Deno.env.get('GCP_CLIENT_SECRET'),
                redirect_uri: Deno.env.get('GCP_REDIRECT_URI'),
                grant_type: 'authorization_code',
            })
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.json();
            throw { status: 400, message: `Google token exchange failed: ${errorBody.error_description}` };
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, expires_in } = tokens;
        if (!refresh_token) throw { status: 400, message: 'No refresh token received from Google. Please ensure you are using "prompt=consent" in your auth URL.' };
        
        const { data: { user: userToUpdate }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
        if (getUserError) throw getUserError;

        const expiry_time = Date.now() + (expires_in * 1000);
        const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { app_metadata: { ...userToUpdate.app_metadata, google_refresh_token: refresh_token, google_access_token: access_token, google_token_expiry: expiry_time } });
        if (updateUserError) throw updateUserError;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
    
    // --- Endpoints below require authentication ---
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization') } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    const authUser = authData?.user;
    if (authError || !authUser) {
      if (resource) {
        throw { message: 'User not authenticated', status: 401 };
      } else {
        return new Response(JSON.stringify({ error: 'Public request with empty/invalid body' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // --- Google Drive Resource ---
    if (resource === 'drive') {
        const { data: { user: driveUser }, error: getDriveUserError } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
        if(getDriveUserError) throw getDriveUserError;

        let accessToken = driveUser.app_metadata?.google_access_token;
        const tokenExpiry = driveUser.app_metadata?.google_token_expiry;
        const refreshToken = driveUser.app_metadata?.google_refresh_token;

        if (action !== 'check-status' && action !== 'unlink' && !refreshToken) {
            throw { status: 403, message: 'Google Drive is not linked. Please re-link your account.' };
        }

        if (action !== 'check-status' && action !== 'unlink' && (!accessToken || Date.now() > (tokenExpiry - 60000))) {
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken, client_id: Deno.env.get('GCP_CLIENT_ID'), client_secret: Deno.env.get('GCP_CLIENT_SECRET'), grant_type: 'refresh_token' })
            });
            if (!tokenResponse.ok) {
                const errorBody = await tokenResponse.json();
                console.error('Failed to refresh Google token:', errorBody);
                throw { status: 401, message: 'Could not refresh Google token. Please re-link your Drive account.' };
            }
            const newTokens = await tokenResponse.json();
            accessToken = newTokens.access_token;
            const new_expiry_time = Date.now() + (newTokens.expires_in * 1000);
            const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { app_metadata: { ...driveUser.app_metadata, google_access_token: accessToken, google_token_expiry: new_expiry_time } });
            if (updateUserError) console.error("Failed to save new Google token", updateUserError);
        }

        switch(action) {
            case 'list-files': {
                const query = payload?.query || "trashed=false";
                const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                if (!response.ok) throw { status: response.status, message: await response.text() };
                const data = await response.json();
                return new Response(JSON.stringify({ files: data.files }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'create-file': {
                 const { name } = payload;
                 const response = await fetch('https://www.googleapis.com/drive/v3/files', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: 'text/plain' }) });
                 if (!response.ok) throw { status: response.status, message: await response.text() };
                 const file = await response.json();
                 return new Response(JSON.stringify({ file }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'get-file-details': {
                const { fileId } = payload;
                const [metaResponse, contentResponse] = await Promise.all([
                    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,webViewLink,iconLink`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
                ]);
                if (!metaResponse.ok || !contentResponse.ok) throw { status: 500, message: "Failed to fetch file details or content." };
                const file = await metaResponse.json();
                file.content = await contentResponse.text();
                return new Response(JSON.stringify({ file }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'update-file': {
                const { fileId, name, content } = payload;
                if (name) await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                if (content !== undefined) await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'text/plain' }, body: content });
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete-file': {
                const { fileId } = payload;
                await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'check-status': {
                return new Response(JSON.stringify({ isLinked: !!refreshToken }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'unlink': {
                const { app_metadata } = driveUser;
                delete app_metadata.google_access_token;
                delete app_metadata.google_refresh_token;
                delete app_metadata.google_token_expiry;
                const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { app_metadata });
                if (updateUserError) throw updateUserError;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            default: throw { status: 400, message: 'Invalid drive action specified.' };
        }
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('*').eq('auth_id', authUser.id).single();
    if (profileError) throw { status: 403, message: 'User profile not found.' };

    if (resource === 'users' && action === 'update_installed_apps') {
        const { appIds } = payload;
        if (!Array.isArray(appIds)) throw { status: 400, message: 'appIds must be an array.' };
    
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ installed_webly_apps: appIds })
            .eq('id', userProfile.id)
            .select('installed_webly_apps')
            .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ installed_webly_apps: data.installed_webly_apps }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // --- Admin-only endpoints ---
    if (userProfile.role === 'Admin') {
        if (resource === 'stats') {
            const { count: messages } = await supabaseAdmin.from('chat_messages').select('*', { count: 'exact', head: true });
            const { count: mails } = await supabaseAdmin.from('mails').select('*', { count: 'exact', head: true });
            const { count: contacts } = await supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true });
            return new Response(JSON.stringify({ stats: { messages, mails, contacts } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
        if (resource === 'database_reset') {
            const { target } = payload;
            let error;
            if (target === 'chat') {
                ({ error } = await supabaseAdmin.from('chat_messages').delete().neq('id', 0));
            } else if (target === 'mail') {
                ({ error } = await supabaseAdmin.from('mails').delete().neq('id', 0));
            } else {
                throw { status: 400, message: 'Invalid reset target.' };
            }
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, message: `${target} has been cleared.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
    }


    switch(resource) {
        case 'chatHistory': {
            const { currentUserId, otherUserId } = payload;
            const chatId = [currentUserId, otherUserId].sort().join('--');
            const { data, error } = await supabaseAdmin.from('chat_messages').select('*, sender:sender_id(*), receiver:receiver_id(*)').eq('chat_id', `chat--${chatId}`).order('timestamp');
            if (error) throw error;
            return new Response(JSON.stringify({ history: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
        case 'mails': {
            switch(action) {
                case 'get': {
                    const { data, error } = await supabaseAdmin.from('mails').select('*').or(`recipient.eq.${userProfile.username},sender.ilike.%${userProfile.username}%`).order('timestamp', { ascending: false });
                    if (error) throw error;
                    return new Response(JSON.stringify({ mails: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                case 'send': {
                    const { data, error } = await supabaseAdmin.from('mails').insert(payload).select().single();
                    if (error) throw error;
                    return new Response(JSON.stringify({ mail: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                case 'markAsRead': {
                    await supabaseAdmin.from('mails').update({ read: true }).eq('id', payload.id);
                    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                case 'delete': {
                    await supabaseAdmin.from('mails').delete().eq('id', payload.id);
                    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
            }
            break;
        }
        case 'contacts': {
             switch(action) {
                case 'get': {
                    const { data, error } = await supabaseAdmin.from('contacts').select('*').eq('owner', userProfile.username).order('name');
                    if (error) throw error;
                    return new Response(JSON.stringify({ contacts: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                case 'add': {
                    const { data, error } = await supabaseAdmin.from('contacts').insert({ ...payload, owner: userProfile.username }).select().single();
                    if (error) throw error;
                    return new Response(JSON.stringify({ contact: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                case 'update': {
                    const { data, error } = await supabaseAdmin.from('contacts').update(payload).eq('id', payload.id).select().single();
                    if (error) throw error;
                    return new Response(JSON.stringify({ contact: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                case 'delete': {
                    await supabaseAdmin.from('contacts').delete().eq('id', payload.id);
                    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
            }
            break;
        }
        default: {
          if (resource) { // Only throw error if resource was specified.
            throw { status: 400, message: 'Invalid resource specified.' };
          }
           // If no resource, it was likely an empty body from a public check, which is fine.
           return new Response(JSON.stringify({ message: "OK" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
    }

  } catch (error) {
    console.error("Error in app-service function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error.status || 500 });
  }
});