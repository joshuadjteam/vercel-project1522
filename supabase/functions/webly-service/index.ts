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
        const { data, error } = await supabaseAdmin
            .from('webly_apps')
            .select('*')
            .order('name');

        // Check for 'undefined_table' error code (42P01)
        if (error && error.code === '42P01') {
            console.warn('Webly Store: `webly_apps` table does not exist. Returning empty list. Please run the setup SQL for full functionality.');
            return new Response(JSON.stringify({ apps: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        } else if (error) {
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
                const { name, description, url, icon_svg, load_in_console } = payload;
                const { data, error } = await supabaseAdmin.from('webly_apps').insert({ name, description, url, icon_svg, load_in_console }).select().single();
                if (error) {
                    if (error.code === '42P01') {
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
                    if (error.code === '42P01') {
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
                    if (error.code === '42P01') {
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