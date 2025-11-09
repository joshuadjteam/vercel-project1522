import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
// Use a stable Node.js library for IMAP via npm specifier for better compatibility
import imaps from "npm:imap-simple";
import { simpleParser } from "npm:mailparser";
import { GoogleGenAI } from 'npm:@google/genai';


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

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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
      // --- VOICE SERVICE ---
      case 'voice-service': {
        console.log('Voice service invoked.');

        // Fetch secrets from the new database table
        const { data: secrets, error: secretsError } = await supabaseAdmin
          .from('function_secrets')
          .select('name, value');

        if (secretsError) {
          console.error("Error fetching secrets from DB:", secretsError);
          throw new Error("Could not retrieve function secrets from the database.");
        }

        const secretsMap = new Map(secrets.map(s => [s.name, s.value]));
        const geminiApiKey = secretsMap.get('API_KEY');
        const elevenLabsApiKey = secretsMap.get('ELEVENLABS_API_KEY');

        if (!geminiApiKey) {
            throw new Error("Gemini API key not found in the function_secrets table.");
        }
        if (!elevenLabsApiKey) {
            throw new Error("ElevenLabs API key not found in the function_secrets table.");
        }

        const { text: userText } = payload;
        if (!userText) {
          throw new Error("Text prompt is required.");
        }

        // 1. Get AI Response from Gemini
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a helpful voice assistant for a web portal called Lynix. Keep your response concise, friendly, and conversational. User said: "${userText}"`,
        });
        
        // FIX: Safely convert the unknown response text to a string.
        let aiTextResponse = String(geminiResponse.text ?? '');
        if (!aiTextResponse || aiTextResponse.trim() === '') {
            aiTextResponse = "I'm sorry, I don't have a response for that. Please try asking another way.";
        }
        
        // 2. Convert Gemini's text to speech using ElevenLabs
        const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Example voice ID (Rachel)

        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsApiKey,
            },
            body: JSON.stringify({
                text: aiTextResponse,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                },
            }),
        });
        
        if (!elevenLabsResponse.ok) {
            const errorBody = await elevenLabsResponse.text();
            console.error("ElevenLabs Error:", errorBody);
            throw new Error('Failed to get audio from ElevenLabs.');
        }

        // 3. Return audio data to frontend
        const audioArrayBuffer = await elevenLabsResponse.arrayBuffer();
        const base64Audio = arrayBufferToBase64(audioArrayBuffer);
        const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

        return new Response(JSON.stringify({ audioDataUrl, transcription: aiTextResponse }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }
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
            const { sender, recipient, subject, body } = payload;
            const { data: senderAccount } = await supabaseAdmin
                .from('mail_accounts')
                .select('*')
                .eq('user_id', authUser.id)
                .eq('email_address', sender)
                .single();

            if (senderAccount) {
                // Send via external SMTP
                const client = new SmtpClient();
                await client.connect({
                    hostname: senderAccount.smtp_server,
                    port: senderAccount.smtp_port,
                    username: senderAccount.smtp_user,
                    password: senderAccount.smtp_pass,
                    // Note: Deno SMTP client handles STARTTLS automatically on non-465 ports
                });
                await client.send({
                    from: senderAccount.email_address,
                    to: recipient,
                    subject: subject,
                    content: body,
                });
                await client.close();
            }

            // Save a copy to our DB regardless
            ({ data, error } = await supabaseAdmin.from('mails').insert({
              sender: sender,
              recipient: recipient,
              subject: subject,
              body: body,
              read: false,
              account_id: senderAccount ? senderAccount.id : null
            }).select().single());

            if (error) throw error;
            return new Response(JSON.stringify({ mail: data }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          case 'sync': {
            const { accountId } = payload;
            const { data: account, error: accError } = await supabaseAdmin
                .from('mail_accounts')
                .select('*')
                .eq('id', accountId)
                .eq('user_id', authUser.id)
                .single();
            if (accError || !account) throw new Error('Account not found or permission denied.');
            
            const config = {
                imap: {
                    user: account.imap_user,
                    password: account.imap_pass,
                    host: account.imap_server,
                    port: account.imap_port,
                    tls: account.imap_encryption === 'SSL/TLS',
                    authTimeout: 5000,
                }
            };

            const connection = await imaps.connect(config);
            await connection.openBox('INBOX');

            const searchCriteria = ['ALL'];
            const fetchOptions = {
                bodies: [''], // Fetch the entire raw message
                markSeen: false
            };

            const messages = await connection.search(searchCriteria, fetchOptions);
            let newMailCount = 0;

            for (const item of messages) {
                const mailSource = item.parts.find(part => part.which === '')?.body;
                if (!mailSource) continue;

                const parsed = await simpleParser(mailSource);
                const timestamp = parsed.date ? new Date(parsed.date) : new Date();

                const { count: existingCount } = await supabaseAdmin
                    .from('mails')
                    .select('*', { count: 'exact', head: true })
                    .eq('account_id', account.id)
                    .eq('subject', parsed.subject || '(no subject)')
                    .eq('timestamp', timestamp.toISOString());
                
                if (existingCount === 0) {
                    const from = parsed.from?.text || 'Unknown Sender';
                    const subject = parsed.subject || '(no subject)';
                    const body = parsed.text || (parsed.html ? "[HTML content - view in original client]" : '[No content]');

                    await supabaseAdmin.from('mails').insert({
                        account_id: account.id,
                        sender: from,
                        recipient: userProfile.username,
                        subject: subject,
                        body: body,
                        timestamp: timestamp.toISOString(),
                        read: false,
                    });
                    newMailCount++;
                }
            }

            connection.end();
            return new Response(JSON.stringify({ message: `Synced ${newMailCount} new message(s).` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
          }
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
      // --- MAIL ACCOUNTS ---
      case 'mail_accounts':
        switch(action) {
            case 'get':
                ({ data, error } = await supabaseAdmin
                    .from('mail_accounts')
                    .select('*')
                    .eq('user_id', authUser.id));
                if (error) throw error;
                return new Response(JSON.stringify({ accounts: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            case 'add':
                ({ data, error } = await supabaseAdmin
                    .from('mail_accounts')
                    .insert({ ...payload, user_id: authUser.id })
                    .select()
                    .single());
                if (error) throw error;
                return new Response(JSON.stringify({ account: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            default:
                throw new Error('Invalid action for mail_accounts');
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
      // --- CALL HISTORY ---
      case 'call-history': {
        switch(action) {
          case 'get': {
            ({ data, error } = await supabaseAdmin
              .from('call_history')
              .select('*')
              .eq('owner', userProfile.username)
              .order('timestamp', { ascending: false }));
            if (error) throw error;
            return new Response(JSON.stringify({ history: data }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
          case 'add': {
            const record = { 
              ...payload, 
              owner: userProfile.username,
              timestamp: new Date().toISOString(),
            };
            ({ data, error } = await supabaseAdmin
              .from('call_history')
              .insert(record)
              .select()
              .single());
            if (error) throw error;
            return new Response(JSON.stringify({ record: data }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
          default:
            throw new Error('Invalid action for call-history');
        }
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