import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

// Check for missing configuration
const missing: string[] = [];
if (!supabaseUrl) missing.push('REACT_APP_SUPABASE_URL');
if (!supabaseAnonKey) missing.push('REACT_APP_SUPABASE_ANON_KEY');

if (missing.length) {
  console.warn('Missing Supabase config keys:', missing.join(', '));
  console.warn('Authentication features will be disabled. Please configure Supabase environment variables.');
}

// Create Supabase client with fallback values to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Add a method to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};


