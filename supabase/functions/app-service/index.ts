import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const getChatId = (userId1, userId2)=>{
  return [
    'chat',
    ...[
      userId1,
      userId2
    ].sort()
  ].join('--');
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { resource, action, payload } = await req.json();
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) throw new Error('User not authenticated');
    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('id, username, role').eq('auth_id', authUser.id).single();
    if (profileError || !userProfile) throw new Error('User profile not found');
    let data;
    let error;
    switch(resource){
      // --- NOTES ---
      case 'notes':
        switch(action){
          case 'get':
            ({ data, error } = await supabaseAdmin.from('notes').select('*').eq('owner', userProfile.username).order('created_at', {
              ascending: false
            }));
            if (error) throw error;
            return new Response(JSON.stringify({
              notes: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'add':
            ({ data, error } = await supabaseAdmin.from('notes').insert({
              title: payload.title,
              content: payload.content,
              owner: userProfile.username
            }).select().single());
            if (error) throw error;
            return new Response(JSON.stringify({
              note: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'update':
            ({ data, error } = await supabaseAdmin.from('notes').update({
              title: payload.title,
              content: payload.content
            }).eq('id', payload.id).eq('owner', userProfile.username).select().single());
            if (error) throw error;
            return new Response(JSON.stringify({
              note: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'delete':
            ({ error } = await supabaseAdmin.from('notes').delete().eq('id', payload.id).eq('owner', userProfile.username));
            if (error) throw error;
            return new Response(JSON.stringify({
              success: true
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          default:
            throw new Error('Invalid action for notes');
        }
      // --- MAILS ---
      case 'mails':
        switch(action){
          case 'get':
            ({ data, error } = await supabaseAdmin.from('mails').select('*').or(`recipient.eq.${userProfile.username},sender.eq.${userProfile.username}`).order('timestamp', {
              ascending: false
            }));
            if (error) throw error;
            return new Response(JSON.stringify({
              mails: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'send':
            ({ data, error } = await supabaseAdmin.from('mails').insert({
              ...payload,
              sender: userProfile.username
            }).select().single());
            if (error) throw error;
            return new Response(JSON.stringify({
              mail: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'markAsRead':
            ({ error } = await supabaseAdmin.from('mails').update({
              read: true
            }).eq('id', payload.id).eq('recipient', userProfile.username));
            if (error) throw error;
            return new Response(JSON.stringify({
              success: true
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'delete':
            ({ error } = await supabaseAdmin.from('mails').delete().eq('id', payload.id)); // A user can delete mail they sent or received
            if (error) throw error;
            return new Response(JSON.stringify({
              success: true
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          default:
            throw new Error('Invalid action for mails');
        }
      // --- CONTACTS ---
      case 'contacts':
        switch(action){
          case 'get':
            ({ data, error } = await supabaseAdmin.from('contacts').select('*').eq('owner', userProfile.username));
            if (error) throw error;
            return new Response(JSON.stringify({
              contacts: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'add':
            ({ data, error } = await supabaseAdmin.from('contacts').insert({
              ...payload,
              owner: userProfile.username
            }).select().single());
            if (error) throw error;
            return new Response(JSON.stringify({
              contact: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'update':
            ({ data, error } = await supabaseAdmin.from('contacts').update(payload).eq('id', payload.id).eq('owner', userProfile.username).select().single());
            if (error) throw error;
            return new Response(JSON.stringify({
              contact: data
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          case 'delete':
            ({ error } = await supabaseAdmin.from('contacts').delete().eq('id', payload.id).eq('owner', userProfile.username));
            if (error) throw error;
            return new Response(JSON.stringify({
              success: true
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          default:
            throw new Error('Invalid action for contacts');
        }
      // --- CHAT HISTORY ---
      case 'chatHistory':
        const { currentUserId, otherUserId } = payload;
        if (currentUserId !== userProfile.id) {
          throw new Error('User mismatch when fetching chat history.');
        }
        const chatId = getChatId(currentUserId, otherUserId);
        ({ data, error } = await supabaseAdmin.from('chat_messages').select('*, sender:sender_id(*), receiver:receiver_id(*)').eq('chat_id', chatId).order('timestamp', {
          ascending: true
        }));
        if (error) throw error;
        return new Response(JSON.stringify({
          history: data
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      case 'stats':
        if (userProfile.role !== 'Admin') {
          throw new Error('Permission denied: Admin role required.');
        }
        const { count: messagesCount, error: messagesError } = await supabaseAdmin.from('chat_messages').select('*', {
          count: 'exact',
          head: true
        });
        const { count: mailsCount, error: mailsError } = await supabaseAdmin.from('mails').select('*', {
          count: 'exact',
          head: true
        });
        const { count: contactsCount, error: contactsError } = await supabaseAdmin.from('contacts').select('*', {
          count: 'exact',
          head: true
        });
        if (messagesError || mailsError || contactsError) {
          console.error({
            messagesError,
            mailsError,
            contactsError
          });
          throw new Error('Failed to retrieve one or more statistics.');
        }
        const stats = {
          messages: messagesCount || 0,
          mails: mailsCount || 0,
          contacts: contactsCount || 0
        };
        return new Response(JSON.stringify({
          stats
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      default:
        throw new Error(`Invalid resource: ${resource}`);
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
