import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check for valid configuration
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return !url.includes('your-project-ref') && !url.includes('your_supabase_project_url');
  } catch {
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  return !!(key && key !== 'your_supabase_anon_key' && key.length > 20);
};

// More detailed error checking
if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is missing or invalid');
  console.error('Please add your Supabase URL to the .env file');
}

if (!supabaseAnonKey || !isValidKey(supabaseAnonKey)) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or invalid');
  console.error('Please add your Supabase anonymous key to the .env file');
}

// Create a fallback client to prevent URL constructor errors
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey)) {
    // Return a mock client that won't cause URL errors
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      }),
    } as any;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = createSupabaseClient();

// Test the connection only if properly configured
if (isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)) {
  supabase.from('users').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        console.log('💡 Make sure your database tables are created. Run the migrations in Supabase SQL Editor.');
      } else {
        console.log('✅ Supabase connected successfully');
      }
    });
} else {
  console.log('⚠️ Supabase not configured. Please update your .env file with valid credentials.');
}