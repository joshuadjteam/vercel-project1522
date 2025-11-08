import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://example.supabase.co';
const supabaseAnonKey = 'example-anon-key';

if (supabaseUrl === 'https://example.supabase.co' || supabaseAnonKey === 'example-anon-key') {
    console.error(`
        ************************************************************************************************
        *                                                                                              *
        *  ERROR: Supabase credentials are not set. The application will not function correctly.       *
        *  Please update supabaseClient.ts with your project's URL and anon key.                       *
        *                                                                                              *
        ************************************************************************************************
    `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);