import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jnnpxifvsrlzfpaisdhy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubnB4aWZ2c3JsemZwYWlzZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTg5MTgsImV4cCI6MjA3ODEzNDkxOH0.YgFEKp7ifE-9TLzplVDlvKU-5q3GA5hFu0zQ5pI_8kQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Session persistence must be enabled for OAuth to work across redirects.
    // The Supabase client library will automatically handle the session
    // from the URL fragment when the user is redirected back from the provider.
    persistSession: true,
    detectSessionInUrl: true,
  },
});
