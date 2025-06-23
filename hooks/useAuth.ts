import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      // For web, use redirect method
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { data, error };
    } else {
      // For mobile, this would require additional setup with expo-auth-session or Google Sign-In
      // This is a placeholder implementation
      return { 
        data: null, 
        error: { message: 'Connexion Google disponible sur la version web' } 
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
    const { error } = await supabase.auth.signOut();
    return { error };
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
  };
}