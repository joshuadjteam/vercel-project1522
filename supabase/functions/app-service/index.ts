import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
// Use a stable Node.js library for IMAP via npm specifier for better compatibility
import imaps from "npm:imap-simple";
import { simpleParser } from "npm:mailparser";
// FIX: Import GenerateContentResponse to explicitly type the API response, fixing type inference issues.
import { GoogleGenAI, type GenerateContentResponse } from 'npm:@google/genai';


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
          throw new Error(`Could not retrieve function secrets from the database. Make sure the 'function_secrets' table exists and is accessible. DB Error: ${secretsError.message}`);
        }

        const secretsMap = new Map(secrets.map(s => [s.name, s.value]));
        const geminiApiKey = secretsMap.get('API_KEY');
        const elevenLabsApiKey = secretsMap.get('ELEVENLABS_API_KEY');

        if (!geminiApiKey) {
            throw new Error("SETUP INCOMPLETE: Gemini API key (API_KEY) not found in the 'function_secrets' table.");
        }
        if (!elevenLabsApiKey) {
            throw new Error("SETUP INCOMPLETE: ElevenLabs API key (ELEVENLABS_API_KEY) not found in the 'function_secrets' table.");
        }

        