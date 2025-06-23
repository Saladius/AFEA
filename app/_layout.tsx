import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSegments } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (loading) return; // Attendre que l'état d'authentification soit chargé

    const inAuthGroup = segments[0] === '(tabs)';
    
    if (user && !inAuthGroup) {
      // Utilisateur connecté mais pas dans les onglets, rediriger vers le dashboard
      router.replace('/(tabs)');
    } else if (!user && inAuthGroup) {
      // Utilisateur non connecté mais dans les onglets, rediriger vers landing
      router.replace('/landing');
    } else if (!user && segments[0] !== 'landing' && segments[0] !== 'auth') {
      // Utilisateur non connecté et pas sur landing/auth, rediriger vers landing
      router.replace('/landing');
    }
  }, [user, loading, segments]);

  if (!fontsLoaded && !fontError) {
    return null;
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