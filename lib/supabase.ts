import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// More detailed error checking
if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is missing from environment variables');
  console.error('Please add your Supabase URL to the .env file');
}

if (!supabaseAnonKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables');
  console.error('Please add your Supabase anonymous key to the .env file');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    ❌ Missing Supabase environment variables!
    
    Please follow these steps:
    1. Go to https://supabase.com and create a new project
    2. Copy your project URL and anon key from Settings > API
    3. Update your .env file with:
       EXPO_PUBLIC_SUPABASE_URL=your_project_url
       EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    4. Restart the development server
    
    Current values:
    - SUPABASE_URL: ${supabaseUrl || 'MISSING'}
    - SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Present' : 'MISSING'}
  `);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test the connection
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.log('💡 Make sure your database tables are created. Run the migrations in Supabase SQL Editor.');
    } else {
      console.log('✅ Supabase connected successfully');
    }
  });