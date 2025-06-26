import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

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

  // Handle deep linking for OAuth redirects
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Handle web OAuth redirect
      const handleWebOAuthRedirect = () => {
        const url = window.location.href;
        if (url.includes('#access_token=') || url.includes('?access_token=')) {
          console.log('🔄 Handling OAuth redirect on web');
          // The auth state change will be handled by Supabase automatically
          // Just clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      
      handleWebOAuthRedirect();
    } else {
      // Handle mobile deep linking
      const handleDeepLink = (url: string) => {
        console.log('🔗 Deep link received:', url);
        // Supabase will handle the OAuth tokens automatically
      };
      
      // Listen for incoming links
      const subscription = Linking.addEventListener('url', ({ url }) => {
        handleDeepLink(url);
      });
      
      // Check if app was opened with a link
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      });
      
      return () => subscription?.remove();
    }
  }, []);
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
    } else if (!user && segments.length > 0 && segments[0] !== 'landing' && segments[0] !== 'auth') {
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