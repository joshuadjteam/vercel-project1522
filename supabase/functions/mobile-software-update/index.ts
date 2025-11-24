
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const RELEASES = [
    {
        version: "14.0",
        codeName: "Baltecz",
        releaseDate: "2026-02-10",
        size: "1.2 GB",
        summary: "Android 15.1.0 Simulation. Unlocks the ultimate customization experience.",
        changes: [
            "Modder App (Developer Only)",
            "System-wide Font Customization",
            "Status Bar Modding",
            "Launcher Switching Capability"
        ],
        rank: 5
    },
    {
        version: "13.0",
        codeName: "Jabaseion",
        releaseDate: "2025-12-01",
        size: "850 MB",
        summary: "Android 15 Simulation. Multi-language support and new native media apps.",
        changes: [
            "New Native Apps: Maps, Music, Gallery",
            "Language Support (EN/FR/ES)",
            "Improved Performance"
        ],
        rank: 4
    },
    {
        version: "12.5",
        codeName: "Haraise",
        releaseDate: "2025-06-15",
        size: "450 MB",
        summary: "Enhanced stability and the introduction of the Webly Store.",
        changes: [
            "Webly Store App",
            "UI Refinements"
        ],
        rank: 3
    },
    {
        version: "12.0.2",
        codeName: "Martin",
        releaseDate: "2025-01-20",
        size: "600 MB",
        summary: "The standard mobile experience with core applications.",
        changes: [
            "Initial Release",
            "Core Apps Only (No Store)"
        ],
        rank: 2
    },
    {
        version: "10 Quartz",
        codeName: "Legacy",
        releaseDate: "2024-08-10",
        size: "300 MB",
        summary: "The original operating system interface.",
        changes: [
            "Classic Grid UI",
            "Legacy Icon Set",
            "Basic Functionality"
        ],
        rank: 1
    }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Return full list to allow upgrade/downgrade logic on client
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
