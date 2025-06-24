import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSegments } from 'expo-router';
import SetupGuide from '@/components/SetupGuide';
import { View, Text, StyleSheet } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Check for Supabase configuration errors
  useEffect(() => {
    const checkSupabaseConfig = () => {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'your_supabase_project_url' || 
          supabaseAnonKey === 'your_supabase_anon_key') {
        setSupabaseError('Supabase configuration missing');
        setShowSetupGuide(true);
        return;
      }
      
      setSupabaseError(null);
      setShowSetupGuide(false);
    };

    checkSupabaseConfig();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (loading || showSetupGuide) return; // Wait for auth state and setup

    const inAuthGroup = segments[0] === '(tabs)';
    
    if (user && !inAuthGroup) {
      // User logged in but not in tabs, redirect to dashboard
      router.replace('/(tabs)');
    } else if (!user && inAuthGroup) {
      // User not logged in but in tabs, redirect to landing
      router.replace('/landing');
    } else if (!user && segments.length > 0 && segments[0] !== 'landing' && segments[0] !== 'auth') {
      // User not logged in and not on landing/auth, redirect to landing
      router.replace('/landing');
    }
  }, [user, loading, segments, showSetupGuide]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show setup guide if Supabase is not configured
  if (showSetupGuide) {
    return (
      <SetupGuide 
        onComplete={() => {
          setShowSetupGuide(false);
          // Force a reload to reinitialize Supabase
          window.location.reload();
        }} 
      />
    );
  }

  // Show error if there's a Supabase configuration issue
  if (supabaseError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorText}>
          Please configure your Supabase environment variables in the .env file
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
});