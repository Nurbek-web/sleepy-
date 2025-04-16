import { createClient } from '@supabase/supabase-js';

// Use environment variables in a real application
const supabaseUrl = 'https://fjyvebenqepvftjnupxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeXZlYmVucWVwdmZ0am51cHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MzA5MjcsImV4cCI6MjA2MDQwNjkyN30.Anqn4DRfJD38_MYmkZHQ7eOCCIgrYivrJOQdILeurL8';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 