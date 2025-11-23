
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Simulate a check
    const info = {
        currentVersion: "13.0",
        currentCodeName: "VanillaIce",
        latestVersion: "13.0",
        latestCodeName: "VanillaIce",
        releaseDate: "2025-12-01",
        size: "850 MB",
        summary: "Welcome to Android 15 Simulation. This major update introduces a new App Drawer, Multi-language support (EN/FR/ES), new Maps, Music, and Gallery apps, and enhanced stability.",
        changes: [
            "Android 15 UI styling",
            "New App Drawer (Swipe Up)",
            "Language Support (English, French, Spanish)",
            "New Native Apps: Maps, Music, Gallery",
            "Faster Refresh Cycle (90s)",
            "Improved Camera Integration"
        ]
    };

    return new Response(JSON.stringify(info), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
    });
  }
});
