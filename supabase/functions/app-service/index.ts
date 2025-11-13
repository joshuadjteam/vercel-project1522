
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
    const { resource, action, payload } = body;

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // --- Public endpoints that do not require auth ---
    if (resource === 'drive' && action === 'get-oauth-config') {
        const clientId = Deno.env.get('GCP_CLIENT_ID');
        const redirectUri = Deno.env.get('GCP_REDIRECT_URI');
        if (!clientId || !redirectUri) {
            throw { status: 500, message: 'Google Drive OAuth is not configured on the server.' };
        }
        return new Response(JSON.stringify({
            clientId,
            redirectUri
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    if (resource === 'auth' && action === 'loginAndLinkDrive') {
        const { email, password, code } = payload;
        if (!email || !password || !code) {
            throw { status: 400, message: 'Email, password, and authorization code are required.' };
        }

        // 1. Authenticate the user to verify identity
        const authClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '', 
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw { status: 401, message: 'Authentication failed: Invalid credentials.' };
        }
        const authUser = signInData.user;
        if (!authUser) {
          throw { status: 401, message: 'Authentication failed.' };
        }

        // 2. Exchange Google code for tokens
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
            console.error("Google token exchange failed:", errorBody);
            throw { status: 400, message: `Google token exchange failed: ${errorBody.error_description}` };
        }

        const tokens = await tokenResponse.json();
        const { refresh_token } = tokens;

        if (!refresh_token) {
            throw { status: 400, message: 'No refresh token received from Google. Please ensure you are using "prompt=consent" in your auth URL.' };
        }
        
        // 3. Save the refresh token to the user's metadata
        const { data: { user: userToUpdate }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
        if (getUserError) throw getUserError;

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { user_metadata: { ...userToUpdate.user_metadata, drive_refresh_token: refresh_token } }
        );

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // --- Authenticated endpoints ---
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    const authUser = authData?.user;

    if (authError || !authUser) throw { message: 'User not authenticated', status: 401 };
    
    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('id, username, role').eq('auth_id', authUser.id).single();
    if (profileError || !userProfile) throw { message: 'User profile not found', status: 404 };
    
    switch(resource){
      case 'stats': {
        if (userProfile.role !== 'Admin') throw { message: 'Permission denied', status: 403 };
        const { count: messages } = await supabaseAdmin.from('chat_messages').select('*', { count: 'exact', head: true });
        const { count: mails } = await supabaseAdmin.from('mails').select('*', { count: 'exact', head: true });
        const { count: contacts } = await supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true });

        return new Response(JSON.stringify({ stats: { messages: messages ?? 0, mails: mails ?? 0, contacts: contacts ?? 0 } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }
      break;
      case 'drive': {
        // This block needs an access token for all its actions.
        const { data: { user: userWithMetadata }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
        if (getUserError) throw getUserError;
        const refresh_token = userWithMetadata?.user_metadata?.drive_refresh_token;
        if (!refresh_token) {
            throw { status: 401, message: 'Google Drive token not found. Please link your account.' };
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: Deno.env.get('GCP_CLIENT_ID'),
                client_secret: Deno.env.get('GCP_CLIENT_SECRET'),
                refresh_token: refresh_token,
                grant_type: 'refresh_token',
            })
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.json();
            if (errorBody.error === 'invalid_grant') {
                const newMetadata = { ...userWithMetadata.user_metadata };
                delete newMetadata.drive_refresh_token;
                await supabaseAdmin.auth.admin.updateUserById(authUser.id, { user_metadata: newMetadata });
                throw { status: 401, message: 'Access revoked. Please re-link your Google Drive account.' };
            }
            console.error("Google access token refresh failed:", errorBody);
            throw { status: 500, message: 'Failed to refresh Google access token.' };
        }
        const { access_token } = await tokenResponse.json();

        switch(action) {
            case 'check-status': {
                return new Response(JSON.stringify({ isLinked: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'unlink': {
                const newMetadata = { ...userWithMetadata.user_metadata };
                delete newMetadata.drive_refresh_token;
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { user_metadata: newMetadata });
                if (updateError) throw updateError;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'list-files': {
                const { query } = payload || {};
                const driveApiUrl = new URL('https://www.googleapis.com/drive/v3/files');
                driveApiUrl.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, webViewLink, iconLink)');
                driveApiUrl.searchParams.set('pageSize', '100');
                if (query) {
                    driveApiUrl.searchParams.set('q', query);
                }
                const driveResponse = await fetch(driveApiUrl.toString(), { headers: { 'Authorization': `Bearer ${access_token}` } });
                if (!driveResponse.ok) {
                    const errorBody = await driveResponse.json();
                    throw { status: 500, message: `Failed to fetch files from Google Drive: ${errorBody.error.message}` };
                }
                const driveData = await driveResponse.json();
                return new Response(JSON.stringify({ files: driveData.files }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'create-file': {
                const { name } = payload;
                if (!name) throw { status: 400, message: 'File name is required.' };
                const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, mimeType: 'text/plain' }),
                });
                if (!driveResponse.ok) {
                    const errorBody = await driveResponse.json();
                    throw { status: 500, message: `Failed to create file in Google Drive: ${errorBody.error.message}` };
                }
                const newFile = await driveResponse.json();
                return new Response(JSON.stringify({ file: newFile }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'get-file-details': {
                const { fileId } = payload;
                if (!fileId) throw { status: 400, message: 'File ID is required.' };
                const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name`, { headers: { 'Authorization': `Bearer ${access_token}` } });
                if (!metaResponse.ok) {
                    const errorBody = await metaResponse.json();
                    throw { status: 500, message: `Failed to get file metadata: ${errorBody.error.message}` };
                }
                const metadata = await metaResponse.json();
                const contentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { 'Authorization': `Bearer ${access_token}` } });
                let content = '';
                if (contentResponse.ok && contentResponse.status !== 204) {
                    content = await contentResponse.text();
                }
                return new Response(JSON.stringify({ file: { ...metadata, content } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'update-file': {
                const { fileId, name, content } = payload;
                if (!fileId) throw { status: 400, message: 'File ID is required.' };
                if (name) {
                    const metaUpdateRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name }),
                    });
                    if (!metaUpdateRes.ok) {
                        const errorBody = await metaUpdateRes.json();
                        throw { status: 500, message: `Failed to update file metadata: ${errorBody.error.message}` };
                    }
                }
                if (typeof content === 'string') {
                    const contentUpdateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'text/plain' },
                        body: content,
                    });
                     if (!contentUpdateRes.ok) {
                        const errorBody = await contentUpdateRes.json();
                        throw { status: 500, message: `Failed to update file content: ${errorBody.error.message}` };
                    }
                }
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete-file': {
                const { fileId } = payload;
                if (!fileId) throw { status: 400, message: 'File ID is required.' };
                const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${access_token}` },
                });
                if (deleteResponse.status !== 204) {
                    try {
                        const errorBody = await deleteResponse.json();
                        throw { status: deleteResponse.status, message: `Failed to delete file: ${errorBody.error.message}` };
                    } catch(e) {
                         throw { status: deleteResponse.status, message: `Failed to delete file.` };
                    }
                }
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
      }
      break;
      case 'chatHistory': {
            const { currentUserId, otherUserId } = payload;
            if (typeof currentUserId !== 'number' || typeof otherUserId !== 'number') {
                throw { status: 400, message: 'Invalid user IDs provided for chat history.' };
            }

            const chatId = ['chat', ...[currentUserId, otherUserId].sort()].join('--');

            const { data, error } = await supabaseAdmin
                .from('chat_messages')
                .select('*, sender:sender_id(*), receiver:receiver_id(*)')
                .eq('chat_id', chatId)
                .order('timestamp', { ascending: true });

            if (error) throw error;

            return new Response(JSON.stringify({ history: data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
      }
      break;
      case 'mails': {
        switch(action) {
            case 'get': {
                 // Fetch all mails. Frontend will filter into inbox/sent.
                 const { data: mails, error } = await supabaseAdmin.from('mails').select('*');
                 if (error) throw error;
                 return new Response(JSON.stringify({ mails }), {
                     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                     status: 200,
                 });
            }
            case 'send': {
                const { recipient, subject, body, sender } = payload;
                let recipientId = null;
                let accountId = null;

                // Determine if the recipient is an internal user
                const { data: recipientUser } = await supabaseAdmin.from('users').select('id').eq('username', recipient).single();
                if (recipientUser) {
                    recipientId = recipientUser.id;
                }

                // Check if sending from an external account to log the account_id
                const { data: sendingAccount } = await supabaseAdmin.from('mail_accounts').select('id').eq('email_address', sender).eq('user_id', authUser.id).single();
                if (sendingAccount) {
                    accountId = sendingAccount.id;
                }

                const { data: mail, error } = await supabaseAdmin
                    .from('mails')
                    .insert({
                        sender: sender,
                        recipient: recipient, // this is the username/email string
                        recipient_id: recipientId, // this is the numeric ID
                        account_id: accountId,
                        subject: subject,
                        body: body,
                    })
                    .select()
                    .single();
                if (error) throw error;
                
                return new Response(JSON.stringify({ mail }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
            case 'markAsRead': {
                const { id } = payload;
                const { error } = await supabaseAdmin.from('mails').update({ read: true }).eq('id', id);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                const { id } = payload;
                const { error } = await supabaseAdmin.from('mails').delete().eq('id', id);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'sync': {
                const { accountId } = payload;
                const { data: account, error } = await supabaseAdmin
                    .from('mail_accounts')
                    .select('*')
                    .eq('id', accountId)
                    .eq('user_id', authUser.id) // Security check
                    .single();
                
                if (error) throw error;
                if (!account) throw { status: 404, message: "Account not found or access denied." };

                // Placeholder for actual IMAP sync logic
                // In a real app, this would connect to the IMAP server and fetch emails
                
                return new Response(JSON.stringify({ success: true, message: `Sync started for ${account.display_name}` }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
        }
      }
      break;
      case 'mail_accounts': {
        switch (action) {
            case 'get': {
                const { data, error } = await supabaseAdmin.from('mail_accounts').select('*').eq('user_id', authUser.id);
                if (error) throw error;
                return new Response(JSON.stringify({ accounts: data }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
            case 'add': {
                const { error } = await supabaseAdmin.from('mail_accounts').insert({ ...payload, user_id: authUser.id });
                if (error) throw error;
                 return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
        }
      }
      break;
      case 'contacts': {
        switch (action) {
            case 'get': {
                const { data, error } = await supabaseAdmin.from('contacts').select('*').eq('owner', userProfile.username);
                if (error) throw error;
                return new Response(JSON.stringify({ contacts: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'add': {
                const { data, error } = await supabaseAdmin.from('contacts').insert({ ...payload, owner: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ contact: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'update': {
                const { id, ...updateData } = payload;
                const { data, error } = await supabaseAdmin.from('contacts').update(updateData).eq('id', id).eq('owner', userProfile.username).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ contact: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                const { id } = payload;
                const { error } = await supabaseAdmin.from('contacts').delete().eq('id', id).eq('owner', userProfile.username);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
      }
      break;
      case 'notes': {
        switch (action) {
            case 'get': {
                const { data, error } = await supabaseAdmin.from('notes').select('*').eq('owner', userProfile.username).order('created_at', { ascending: false });
                if (error) throw error;
                return new Response(JSON.stringify({ notes: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'add': {
                const { data, error } = await supabaseAdmin.from('notes').insert({ ...payload, owner: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ note: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'update': {
                const { id, title, content } = payload;
                const { data, error } = await supabaseAdmin.from('notes').update({ title, content }).eq('id', id).eq('owner', userProfile.username).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ note: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                const { id } = payload;
                const { error } = await supabaseAdmin.from('notes').delete().eq('id', id).eq('owner', userProfile.username);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
      }
      break;
      default:
        throw { message: 'Invalid resource specified', status: 400 };
    }
  } catch (error) {
    console.error("Error in app-service function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the edge function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.status || 500,
    });
  }
});
