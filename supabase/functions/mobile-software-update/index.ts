
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const RELEASES = [
    {
        version: "13.0",
        codeName: "VanillaIce",
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
        ],
        rank: 4
    },
    {
        version: "12.5",
        codeName: "Refined",
        releaseDate: "2025-06-15",
        size: "450 MB",
        summary: "A bridge update bringing enhanced stability and UI refinements before the major 13.0 overhaul.",
        changes: [
            "Improved UI responsiveness",
            "Security patches",
            "Preparation for Android 15 style update"
        ],
        rank: 3
    },
    {
        version: "12.0.2",
        codeName: "Foundation",
        releaseDate: "2025-01-20",
        size: "600 MB",
        summary: "The standard mobile experience.",
        changes: [
            "Initial Release",
            "Core Apps"
        ],
        rank: 2
    },
    {
        version: "10 Quartz",
        codeName: "Legacy",
        releaseDate: "2024-08-10",
        size: "300 MB",
        summary: "The original operating system before the modern Android lookalike redesign. Downgrade to experience the classic interface.",
        changes: [
            "Original UI",
            "Legacy Feature Set"
        ],
        rank: 1
    }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // We simply return the full list of releases now to allow the frontend to handle Upgrade/Downgrade logic
    return new Response(JSON.stringify({
        releases: RELEASES
    }), { 
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
