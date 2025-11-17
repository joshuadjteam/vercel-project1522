// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, linting, and type checking.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const defaultApps = [
    { name: 'Google', description: 'Surf the Web', url: 'https://google.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>' },
    { name: 'ChatGPT', description: 'Ask a companion', url: 'https://chatgpt.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.47-1.47l-1.188-.648 1.188-.648a2.25 2.25 0 011.47-1.47l.648-1.188.648 1.188a2.25 2.25 0 011.47 1.47l1.188.648-1.188.648a2.25 2.25 0 01-1.47 1.47z" /></svg>' },
    { name: 'Poki', description: 'Play Games', url: 'https://poki.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>' },
    { name: 'Gmail', description: 'Check your Mail!', url: 'https://gmail.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>' },
    { name: 'Outlook', description: 'Check your Mail!', url: 'https://outlook.live.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>' },
    { name: 'GitHub', description: 'Code!', url: 'https://github.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>' },
    { name: 'Translate', description: 'Switch language from english to another!', url: 'https://www.deepl.com/en/translator', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>' },
    { name: 'YouTube', description: 'Entertainment', url: 'https://youtube.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>' },
    { name: 'TikTok', description: 'Entertainment', url: 'https://tiktok.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V7.5A2.25 2.25 0 0013.5 6h-5a2.25 2.25 0 00-2.25 2.25v6.106A2.25 2.25 0 008.25 16.5" /></svg>' },
    { name: 'iCloud', description: 'Manage your Apple ID', url: 'https://icloud.com', icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5h10.5a4.5 4.5 0 004.5-4.5c0-2.356-1.636-4.28-3.8-4.836a5.25 5.25 0 00-10.4 0C4.303 10.418 2.25 12.38 2.25 15z" /></svg>' },
];


/**
 * Creates a standardized error response.
 * Logs errors to the console for server-side debugging.
 * @param message The error message for the response body.
 * @param status The standard HTTP status code (e.g., 400, 401, 500).
 */
const createErrorResponse = (message: string, status: number) => {
    console.error(`Webly Service Error (Status ${status}):`, message);
    return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status,
    });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createErrorResponse('This service only accepts POST requests.', 405);
  }

  try {
    const body = await req.json().catch(() => {
        throw { status: 400, message: 'Invalid JSON in request body.' };
    });

    const { action, payload } = body as any;

    if (!action) {
        return createErrorResponse('Request body must include an "action".', 400);
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'get': {
        // Attempt to seed the database idempotently.
        const { error: upsertError } = await supabaseAdmin
            .from('webly_apps')
            .upsert(defaultApps, { onConflict: 'name' });

        // If the upsert fails because the table does not exist, serve the default apps as a fallback.
        if (upsertError && (upsertError.message.includes('relation "public.webly_apps" does not exist') || upsertError.message.includes("Could not find the table 'public.webly_apps'"))) {
            console.warn('Webly Store: `webly_apps` table does not exist. Serving default apps. Please create the table for full functionality.');
            return new Response(JSON.stringify({ apps: defaultApps }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        } else if (upsertError) {
            // Log other upsert errors but attempt to continue. The select might still work.
            console.warn(`Webly Store: Non-critical error during upsert seeding: ${upsertError.message}`);
        }

        // Fetch the current state of the store.
        const { data, error } = await supabaseAdmin
            .from('webly_apps')
            .select('*')
            .order('name');

        if (error) {
            // This will catch errors if the table exists but is unreadable, etc.
            return createErrorResponse(`Database Failure: Could not retrieve apps. Details: ${error.message}`, 500);
        }
        
        return new Response(JSON.stringify({ apps: data || [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }

      case 'add':
      case 'update':
      case 'delete': {
        // Admin-only actions below
        const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization') } } });
        const { data: authData, error: authError } = await userClient.auth.getUser();
        if (authError || !authData.user) {
          return createErrorResponse('Authentication required.', 401);
        }

        const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('role').eq('auth_id', authData.user.id).single();
        if (profileError) {
          return profileError.code === 'PGRST116'
             ? createErrorResponse('User profile not found for authenticated user.', 404)
             : createErrorResponse(`Database Failure: Could not fetch user profile. Details: ${profileError.message}`, 500);
        }
        if (userProfile.role !== 'Admin') {
          return createErrorResponse('Permission Denied: Admin role required.', 403);
        }
        
        // Process admin actions
        switch (action) {
            case 'add': {
                if (!payload || !payload.name || !payload.url) return createErrorResponse('Payload with name and url is required.', 400);
                const { name, description, url, icon_svg } = payload;
                const { data, error } = await supabaseAdmin.from('webly_apps').insert({ name, description, url, icon_svg }).select().single();
                if (error) {
                    if (error.message.includes('relation "public.webly_apps" does not exist')) {
                        return createErrorResponse('Database setup incomplete: "webly_apps" table not found. Admin actions are disabled.', 500);
                    }
                    return createErrorResponse(`Database Failure: Could not add app. Details: ${error.message}`, 500);
                }
                return new Response(JSON.stringify({ app: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 });
            }
            case 'update': {
                if (!payload || !payload.id) return createErrorResponse('Payload with an ID is required.', 400);
                const { id, ...updates } = payload;
                const { data, error } = await supabaseAdmin.from('webly_apps').update(updates).eq('id', id).select().single();
                if (error) {
                    if (error.message.includes('relation "public.webly_apps" does not exist')) {
                        return createErrorResponse('Database setup incomplete: "webly_apps" table not found. Admin actions are disabled.', 500);
                    }
                    return createErrorResponse(`Database Failure: Could not update app. Details: ${error.message}`, 500);
                }
                return new Response(JSON.stringify({ app: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            case 'delete': {
                if (!payload || !payload.id) return createErrorResponse('Payload with an ID is required.', 400);
                const { id } = payload;
                const { error } = await supabaseAdmin.from('webly_apps').delete().eq('id', id);
                if (error) {
                    if (error.message.includes('relation "public.webly_apps" does not exist')) {
                        return createErrorResponse('Database setup incomplete: "webly_apps" table not found. Admin actions are disabled.', 500);
                    }
                    return createErrorResponse(`Database Failure: Could not delete app. Details: ${error.message}`, 500);
                }
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }
        break;
      }

      default: {
        return createErrorResponse('Invalid action specified.', 400);
      }
    }

  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'An unexpected error occurred.';
    return createErrorResponse(message, status);
  }
});