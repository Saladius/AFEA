import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configure WebBrowser for OAuth
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to ensure user exists in users table
  const ensureUserExists = async (authUser: User) => {
    try {
      console.log('🔄 Checking if user exists in users table:', authUser.id);
      
      // Check if user exists in users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if user doesn't exist
        console.error('❌ Error checking user existence:', fetchError);
        throw fetchError;
      }

      if (!existingUser) {
        console.log('👤 User not found in users table, creating...');
        
        // Create user record
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || null,
              avatar_url: authUser.user_metadata?.avatar_url || null,
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating user record:', insertError);
          throw insertError;
        }

        console.log('✅ User record created:', newUser);
      } else {
        console.log('✅ User already exists in users table');
      }
    } catch (error) {
      console.error('❌ Error ensuring user exists:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        try {
          await ensureUserExists(session.user);
          setUser(session.user);
        } catch (error) {
          console.error('❌ Error ensuring user exists on initial load:', error);
          // Still set the user even if there's an error, but log it
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.id);
      
      setSession(session);
      
      if (session?.user) {
        try {
          await ensureUserExists(session.user);
          setUser(session.user);
        } catch (error) {
          console.error('❌ Error ensuring user exists on auth change:', error);
          // Still set the user even if there's an error, but log it
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { data, error };
      }

      if (data.user) {
        try {
          await ensureUserExists(data.user);
          console.log('✅ User signed in and record ensured');
        } catch (userError) {
          console.error('❌ Error ensuring user exists after sign in:', userError);
          // Don't fail the sign in, but log the error
        }
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Unexpected error during sign in:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Erreur de connexion inattendue' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('🔄 Signing up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { data, error };
      }

      if (data.user) {
        try {
          await ensureUserExists(data.user);
          console.log('✅ User signed up and record created');
        } catch (userError) {
          console.error('❌ Error creating user record after sign up:', userError);
          // Don't fail the sign up, but log the error
        }
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Unexpected error during sign up:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Erreur de création de compte inattendue' 
        } 
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Starting Google OAuth sign in');
      
      if (Platform.OS === 'web') {
        // For web, use redirect method
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/(tabs)` : undefined,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        
        if (error) {
          console.error('❌ Google OAuth error (web):', error);
          return { data, error };
        }
        
        console.log('✅ Google OAuth initiated (web)');
        return { data, error };
      } else {
        // For mobile platforms, get the correct redirect URI
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'exp',
          path: '/(tabs)',
        });
        
        console.log('📱 Mobile redirect URI:', redirectUri);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUri,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        
        if (error) {
          console.error('❌ Google OAuth error (mobile):', error);
          return { data, error };
        }
        
        console.log('✅ Google OAuth initiated (mobile)');
        return { data, error };
      }
    } catch (error) {
      console.error('❌ Unexpected error during Google OAuth:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Erreur de connexion Google inattendue' 
        } 
      };
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      // This would require additional setup with Supabase Auth and SMS provider
      // For now, return a placeholder implementation
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Authentification par téléphone sera bientôt disponible' } 
      };
    }
  };

  const signUpWithPhone = async (phoneNumber: string, fullName?: string) => {
    try {
      // This would require additional setup with Supabase Auth and SMS provider
      // For now, return a placeholder implementation
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Création de compte par téléphone sera bientôt disponible' } 
      };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Signing out user');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
        throw error;
      }
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      console.log('✅ User signed out successfully');
      
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  return {
    session,
    user,
    loading,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    signUpWithPhone,
    signUp,
    signOut,
    ensureUserExists, // Export this for manual use if needed
  };
}