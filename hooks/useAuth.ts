import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { twilioService } from '@/services/twilio';

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
        // For mobile platforms with Expo Go, we need to use a different approach
        console.log('📱 Starting mobile Google OAuth with Expo Go compatibility');
        
        // Create the redirect URI for Expo Go
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'exp',
          path: '/(tabs)',
        });
        
        console.log('📱 Mobile redirect URI:', redirectUri);
        
        // For Expo Go, we need to open the OAuth URL manually
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
        
        // For mobile, we need to manually open the browser
        if (data.url) {
          console.log('🌐 Opening OAuth URL in browser:', data.url);
          
          // Use WebBrowser to open the OAuth URL
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUri,
            {
              showInRecents: false,
            }
          );
          
          console.log('📱 WebBrowser result:', result);
          
          if (result.type === 'success' && result.url) {
            // Parse the URL to extract tokens
            const url = new URL(result.url);
            const fragment = url.hash.substring(1);
            const params = new URLSearchParams(fragment);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
              console.log('✅ OAuth tokens received, setting session');
              
              // Set the session with the received tokens
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || null,
              });
              
              if (sessionError) {
                console.error('❌ Error setting session:', sessionError);
                return { data: null, error: sessionError };
              }
              
              console.log('✅ Google OAuth successful (mobile)');
              return { data: sessionData, error: null };
            }
          }
          
          if (result.type === 'cancel') {
            return { 
              data: null, 
              error: { message: 'Connexion annulée par l\'utilisateur' } 
            };
          }
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
      console.log('🔄 Starting phone signin process:', phoneNumber);
      
      // Envoyer le code de vérification via Twilio
      const twilioResult = await twilioService.sendVerificationCode(phoneNumber);
      
      if (!twilioResult.success) {
        return { 
          data: null, 
          error: { message: twilioResult.error || 'Erreur lors de l\'envoi du code' } 
        };
      }
      
      return { 
        data: { phoneNumber }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Erreur lors de l\'envoi du code de vérification' } 
      };
    }
  };

  const signUpWithPhone = async (phoneNumber: string, fullName?: string) => {
    try {
      console.log('🔄 Starting phone signup process:', phoneNumber);
      
      // Envoyer le code de vérification via Twilio
      const twilioResult = await twilioService.sendVerificationCode(phoneNumber);
      
      if (!twilioResult.success) {
        return { 
          data: null, 
          error: { message: twilioResult.error || 'Erreur lors de l\'envoi du code' } 
        };
      }
      
      // Retourner un succès temporaire - la vérification se fera dans une étape séparée
      return { 
        data: { phoneNumber, fullName }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Erreur lors de l\'envoi du code de vérification' } 
      };
    }
  };

  const verifyPhoneAndCreateAccount = async (phoneNumber: string, verificationCode: string, fullName?: string) => {
    try {
      console.log('🔄 Verifying phone and creating account:', phoneNumber);
      
      // Vérifier le code avec Twilio
      const twilioResult = await twilioService.verifyCode(phoneNumber, verificationCode);
      
      if (!twilioResult.success) {
        return { 
          data: null, 
          error: { message: twilioResult.error || 'Code de vérification invalide' } 
        };
      }
      
      // Une fois le téléphone vérifié, créer le compte avec Supabase
      // Utiliser le numéro de téléphone comme email temporaire
      const tempEmail = `${phoneNumber.replace(/\D/g, '')}@phone.temp`;
      const tempPassword = Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName,
            phone: phoneNumber,
            phone_verified: true,
          },
        },
      });
      
      if (error) {
        console.error('❌ Supabase signup error:', error);
        return { data, error };
      }
      
      console.log('✅ Phone account created successfully');
      return { data, error };
    } catch (error) {
      console.error('❌ Error in verifyPhoneAndCreateAccount:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Erreur lors de la création du compte' 
        } 
      };
    }
  };

  const verifyPhoneAndSignIn = async (phoneNumber: string, verificationCode: string) => {
    try {
      console.log('🔄 Verifying phone and signing in:', phoneNumber);
      
      // Vérifier le code avec Twilio
      const twilioResult = await twilioService.verifyCode(phoneNumber, verificationCode);
      
      if (!twilioResult.success) {
        return { 
          data: null, 
          error: { message: twilioResult.error || 'Code de vérification invalide' } 
        };
      }
      
      // Chercher l'utilisateur avec ce numéro de téléphone
      const tempEmail = `${phoneNumber.replace(/\D/g, '')}@phone.temp`;
      
      // Essayer de se connecter avec l'email temporaire
      // Note: Dans un vrai système, vous devriez avoir une meilleure façon de gérer cela
      const { data, error } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: 'temp_password_needs_better_implementation',
      });
      
      if (error) {
        return { 
          data: null, 
          error: { message: 'Aucun compte trouvé avec ce numéro de téléphone' } 
        };
      }
      
      console.log('✅ Phone signin successful');
      return { data, error };
    } catch (error) {
      console.error('❌ Error in verifyPhoneAndSignIn:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Erreur lors de la connexion' 
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Signing out user');
      
      // Clear local state immediately for faster UI response
      setSession(null);
      setUser(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
        // Don't throw error, just log it - user state is already cleared
        console.log('⚠️ Supabase signOut had error but user state is cleared');
      }
      
      console.log('✅ User signed out successfully');
      
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Clear state even on error to ensure user can't stay logged in
      setSession(null);
      setUser(null);
      return { error };
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
    verifyPhoneAndCreateAccount,
    verifyPhoneAndSignIn,
    signUp,
    signOut,
    ensureUserExists, // Export this for manual use if needed
  };
}