import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

if (process.env.NODE_ENV !== 'production') {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('REACT_APP_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('REACT_APP_SUPABASE_ANON_KEY');
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error('Missing Supabase config keys:', missing.join(', '));
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


