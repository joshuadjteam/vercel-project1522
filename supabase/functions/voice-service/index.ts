import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// FIX: Import GenerateContentResponse to explicitly type the API response, fixing type inference issues.
import { GoogleGenAI, type GenerateContentResponse } from 'npm:@google/genai';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text: userText } = await req.json();
    if (!userText) {
      throw new Error("Text prompt is required.");
    }

    // --- 1. Get AI Response from Gemini ---
    const geminiApiKey = Deno.env.get('API_KEY');
    if (!geminiApiKey) {
        throw new Error("Gemini API key not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    // FIX: Explicitly typing the response from the Gemini API addresses an issue where
    // the type was being inferred as 'unknown' in the Deno environment, causing a type error.
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a helpful voice assistant for a web portal called Lynix. Keep your response concise, friendly, and conversational. User said: "${userText}"`,
    });
    
    // FIX: The type of `geminiResponse.text` can be inferred as `unknown` in Deno.
    // To fix the resulting type error, we construct the text response directly from the candidate parts.
    const candidate = geminiResponse.candidates?.[0];
    let aiTextResponse = (candidate?.content?.parts ?? []).map((part) => part.text).join('');
    // Add a fallback for empty responses to make the function more robust
    if (!aiTextResponse || aiTextResponse.trim() === '') {
        aiTextResponse = "I'm sorry, I don't have a response for that. Please try asking another way.";
    }
    
    // --- 2. Convert Gemini's text to speech using ElevenLabs ---
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
        throw new Error("ElevenLabs API key not configured.");
    }
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
            model_id: 'eleven_turbo_v2',
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

    // --- 3. Return audio data to frontend ---
    const audioArrayBuffer = await elevenLabsResponse.arrayBuffer();
    const base64Audio = arrayBufferToBase64(audioArrayBuffer);
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return new Response(JSON.stringify({ audioDataUrl, transcription: aiTextResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("Error in voice-service function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
    });
  }
});