import { createClient } from '@supabase/supabase-js';

// FIX: Updated to prioritize environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) 
// for credentials, with a fallback to the previously hardcoded values. This makes 
// the database connection more robust and adaptable to different deployment 
// environments, resolving potential communication issues.
const supabaseUrl = process.env.SUPABASE_URL || 'https://jnnpxifvsrlzfpaisdhy.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubnB4aWZ2c3JsemZwYWlzZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTg5MTgsImV4cCI6MjA3ODEzNDkxOH0.YgFEKp7ifE-9TLzplVDlvKU-5q3GA5hFu0zQ5pI_8kQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
