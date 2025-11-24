
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const RELEASES = [
    {
        version: "12.0.2",
        codeName: "Classic",
        releaseDate: "2024-01-01",
        size: "N/A",
        summary: "Initial stable release.",
        changes: []
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
        ]
    },
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
        ]
    }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { currentVersion } = await req.json().catch(() => ({ currentVersion: '12.0.2' }));
    
    // Find the index of the current version
    const currentIndex = RELEASES.findIndex(r => r.version === currentVersion);
    
    let nextRelease;
    
    // If current version isn't found, assume the latest.
    // If it is found, check if there is a next one.
    if (currentIndex === -1) {
        // If version is unknown (e.g., 11.0), offer latest.
        nextRelease = RELEASES[RELEASES.length - 1];
    } else if (currentIndex < RELEASES.length - 1) {
        nextRelease = RELEASES[currentIndex + 1];
    } else {
        // Already at latest
        nextRelease = RELEASES[currentIndex];
    }

    return new Response(JSON.stringify({
        latestVersion: nextRelease.version,
        latestCodeName: nextRelease.codeName,
        releaseDate: nextRelease.releaseDate,
        size: nextRelease.size,
        summary: nextRelease.summary,
        changes: nextRelease.changes
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
