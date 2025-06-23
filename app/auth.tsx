import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AuthForm from '@/components/AuthForm';

export default function AuthScreen() {
  const { mode: initialMode } = useLocalSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    initialMode === 'signup' ? 'signup' : 'signin'
  );

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AuthForm mode={mode} onToggleMode={toggleMode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E2E1',
  },
});