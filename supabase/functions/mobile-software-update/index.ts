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
        currentVersion: "12.0.2",
        currentCodeName: "Cookiedough",
        latestVersion: "12.5",
        latestCodeName: "Tomeburge",
        releaseDate: "2025-11-24",
        size: "450 MB",
        summary: "This update brings significant performance improvements to the Lynix core, a new visual identity for the icons, and bug fixes for the camera and phone applications.",
        changes: [
            "New 'Tomeburge' UI refresh",
            "Fixed camera aspect ratio issues",
            "Improved cellular signal simulation",
            "Security patches for browser",
            "Added software update manager"
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