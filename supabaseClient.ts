import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jnnpxifvsrlzfpaisdhy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubnB4aWZ2c3JsemZwYWlzZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTg5MTgsImV4cCI6MjA3ODEzNDkxOH0.YgFEKp7ifE-9TLzplVDlvKU-5q3GA5hFu0zQ5pI_8kQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // By disabling session persistence, the user's session will only be stored in memory
    // and will be lost when the page is refreshed. This directly addresses the issue
    // of getting stuck during session restoration, as there will be no session to restore.
    persistSession: false,
  },
});
