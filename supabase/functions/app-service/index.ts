
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

    // All other endpoints require authentication
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
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
      // voice-service has been moved to its own dedicated function 'voice-service'
      case 'chatHistory': {
        const { currentUserId, otherUserId } = payload;
        const { data, error } = await supabaseAdmin.from('chat_messages').select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)').or(`(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`).order('timestamp', { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify({ history: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      break;
      case 'mails': {
        switch(action) {
            case 'get': {
                const { data: accounts } = await supabaseAdmin.from('mail_accounts').select('id').eq('user_id', authUser.id);
                const accountIds = (accounts || []).map(a => a.id);
                // Ensure the list is not empty to avoid SQL syntax errors, -1 is a safe non-existent ID.
                const accountIdList = accountIds.length > 0 ? accountIds.join(',') : '-1';
                const { data, error } = await supabaseAdmin.from('mails').select('*').or(`recipient.eq.${userProfile.username},account_id.in.(${accountIdList})`);
                if (error) throw error;
                return new Response(JSON.stringify({ mails: data || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'send': {
                const { sender, recipient, subject, body } = payload;
                if (recipient.endsWith('@lynix.local') || !recipient.includes('@')) {
                    const { data, error } = await supabaseAdmin.from('mails').insert({ sender, recipient: recipient.replace('@lynix.local', ''), subject, body, owner: userProfile.username }).select().single();
                    if (error) throw error;
                    return new Response(JSON.stringify({ mail: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
                throw { message: 'External mail sending is not implemented yet', status: 501 };
            }
            case 'markAsRead': {
                const { data, error } = await supabaseAdmin.from('mails').update({ read: true }).match({ id: payload.id, recipient: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ mail: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                const { data, error } = await supabaseAdmin.from('mails').delete().eq('id', payload.id); // Add ownership check in RLS
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'sync': {
                throw { message: 'IMAP sync is not implemented yet', status: 501 };
            }
        }
        break;
      }
      case 'mail_accounts': {
        switch(action) {
            case 'get': {
                const { data, error } = await supabaseAdmin.from('mail_accounts').select('*').eq('user_id', authUser.id);
                if (error) throw error;
                return new Response(JSON.stringify({ accounts: data || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'add': {
                const { data, error } = await supabaseAdmin.from('mail_accounts').insert({ ...payload, user_id: authUser.id }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ account: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
        break;
      }
      case 'contacts': {
        switch(action) {
            case 'get': {
                const { data, error } = await supabaseAdmin.from('contacts').select('*').eq('owner', userProfile.username);
                if (error) throw error;
                return new Response(JSON.stringify({ contacts: data || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'add': {
                const { data, error } = await supabaseAdmin.from('contacts').insert({ ...payload, owner: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ contact: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'update': {
                const { data, error } = await supabaseAdmin.from('contacts').update(payload).match({ id: payload.id, owner: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ contact: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                const { error } = await supabaseAdmin.from('contacts').delete().match({ id: payload.id, owner: userProfile.username });
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
        break;
      }
      case 'notes': {
        switch(action) {
            case 'get': {
                const { data, error } = await supabaseAdmin.from('notes').select('*').eq('owner', userProfile.username);
                if (error) throw error;
                return new Response(JSON.stringify({ notes: data || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'add': {
                const { data, error } = await supabaseAdmin.from('notes').insert({ ...payload, owner: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ note: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'update': {
                const { data, error } = await supabaseAdmin.from('notes').update({ title: payload.title, content: payload.content }).match({ id: payload.id, owner: userProfile.username }).select().single();
                if (error) throw error;
                return new Response(JSON.stringify({ note: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                const { error } = await supabaseAdmin.from('notes').delete().match({ id: payload.id, owner: userProfile.username });
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
        break;
      }
      default:
        throw { message: `Unknown resource: '${resource}'`, status: 404 };
    }

  } catch (error) {
    console.error("Error in app-service function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the edge function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.status || 500,
    });
  }
});
