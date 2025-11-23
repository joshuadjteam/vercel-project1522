
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
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
        throw { status: 400, message: 'Phone number is required.' };
    }

    // Validate format: 2901xxxxxx (10 digits total)
    if (!/^2901\d{6}$/.test(phoneNumber)) {
         throw { status: 400, message: 'Invalid phone number format.' };
    }

    // Extract ID: 2901000005 -> 000005 -> 5
    const userIdStr = phoneNumber.slice(4);
    const userId = parseInt(userIdStr, 10);

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user. We select 'status' or 'call_status' if available in your schema.
    // If not, we assume active. Ideally, this column should exist for "Busy" status.
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        // Error 76A: User doesn't exist or ID is invalid
        return new Response(JSON.stringify({ error: 'Error 76A : The Party is disconnected' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 404 
        });
    }

    // Check if user is busy (Simulated logic based on potential DB fields)
    // Error 76B: User is busy
    if (user.status === 'busy' || user.call_status === 'active') {
         return new Response(JSON.stringify({ error: 'Error 76B : The party is on another call right now.' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 409 
        });
    }

    // User exists and is active
    return new Response(JSON.stringify({ 
        active: true, 
        username: user.username,
        id: user.id 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });

  } catch (error: any) {
    console.error("Error in assigned-number-user:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: error.status || 500 
    });
  }
});
