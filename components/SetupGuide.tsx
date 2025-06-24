import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Database, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Settings
} from 'lucide-react-native';

interface SetupGuideProps {
  onComplete: () => void;
}

export default function SetupGuide({ onComplete }: SetupGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]);

  const steps = [
    {
      title: '1. Créer un projet Supabase',
      description: 'Créez un compte gratuit sur Supabase et un nouveau projet',
      action: 'Aller sur Supabase',
      url: 'https://supabase.com',
      instructions: [
        'Allez sur supabase.com',
        'Créez un compte gratuit',
        'Cliquez sur "New Project"',
        'Choisissez un nom et un mot de passe pour votre base de données',
        'Attendez que le projet soit créé (2-3 minutes)',
      ]
    },
    {
      title: '2. Configurer la base de données',
      description: 'Exécutez le script SQL pour créer les tables nécessaires',
      action: 'Copier le script SQL',
      instructions: [
        'Dans votre projet Supabase, allez dans "SQL Editor"',
        'Cliquez sur "New Query"',
        'Copiez et collez le script SQL complet',
        'Cliquez sur "Run" pour exécuter le script',
        'Vérifiez que les tables ont été créées dans "Table Editor"',
      ]
    },
    {
      title: '3. Configurer les variables d\'environnement',
      description: 'Récupérez vos clés API et configurez l\'application',
      action: 'Copier les variables',
      instructions: [
        'Dans Supabase, allez dans Settings > API',
        'Copiez votre "Project URL"',
        'Copiez votre "anon public" key',
        'Remplacez les valeurs dans le fichier .env',
        'Redémarrez le serveur de développement',
      ]
    }
  ];

  const sqlScript = `-- Complete Database Setup for Afea App
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Clothes table
CREATE TABLE IF NOT EXISTS clothes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  type text NOT NULL,
  color text,
  season text,
  size text,
  material text,
  style text,
  brand text,
  model text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clothes" ON clothes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clothes" ON clothes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clothes" ON clothes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clothes" ON clothes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time text NOT NULL,
  location text,
  event_type text NOT NULL CHECK (event_type IN ('casual', 'formal', 'sport', 'party')),
  icon text NOT NULL,
  status text NOT NULL DEFAULT 'generate' CHECK (status IN ('ready', 'preparing', 'generate')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events" ON events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Outfit suggestions table
CREATE TABLE IF NOT EXISTS outfit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clothes_ids uuid[] NOT NULL,
  suggestion_date date NOT NULL,
  context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own outfit suggestions" ON outfit_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outfit suggestions" ON outfit_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outfit suggestions" ON outfit_suggestions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own outfit suggestions" ON outfit_suggestions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS clothes_user_id_idx ON clothes(user_id);
CREATE INDEX IF NOT EXISTS clothes_type_idx ON clothes(type);
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS outfit_suggestions_user_id_idx ON outfit_suggestions(user_id);

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('clothes-images', 'clothes-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clothes-images');
CREATE POLICY "Public can view images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'clothes-images');`;

  const envTemplate = `# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional: Other services
EXPO_PUBLIC_CLOUD_FUNCTION_TAG_CLOTHES=https://your-region-your-project.cloudfunctions.net/tag-clothes
EXPO_PUBLIC_CLOUD_FUNCTION_SUGGEST_OUTFIT=https://your-region-your-project.cloudfunctions.net/suggest-outfit
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Alert.alert('Copié !', `${label} copié dans le presse-papiers`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier dans le presse-papiers');
    }
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    }
  };

  const markStepComplete = (stepIndex: number) => {
    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[stepIndex] = true;
    setCompletedSteps(newCompletedSteps);
    
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const allStepsComplete = completedSteps.every(step => step);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Settings size={32} color="#EE7518" />
          </View>
          <Text style={styles.title}>Configuration Supabase</Text>
          <Text style={styles.subtitle}>
            Configurez votre base de données pour utiliser Afea
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Étape {currentStep + 1} sur {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Steps */}
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[
                styles.stepIcon,
                completedSteps[index] && styles.stepIconComplete,
                index === currentStep && styles.stepIconCurrent
              ]}>
                {completedSteps[index] ? (
                  <CheckCircle size={24} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>

            {index === currentStep && (
              <View style={styles.stepContent}>
                <View style={styles.instructionsList}>
                  {step.instructions.map((instruction, i) => (
                    <View key={i} style={styles.instructionItem}>
                      <View style={styles.instructionBullet} />
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.stepActions}>
                  {index === 0 && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => openUrl(step.url!)}
                    >
                      <ExternalLink size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>{step.action}</Text>
                    </TouchableOpacity>
                  )}

                  {index === 1 && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => copyToClipboard(sqlScript, 'Script SQL')}
                    >
                      <Copy size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>{step.action}</Text>
                    </TouchableOpacity>
                  )}

                  {index === 2 && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => copyToClipboard(envTemplate, 'Variables d\'environnement')}
                    >
                      <Copy size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>{step.action}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => markStepComplete(index)}
                  >
                    <CheckCircle size={18} color="#10B981" />
                    <Text style={styles.completeButtonText}>Étape terminée</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Complete Setup */}
        {allStepsComplete && (
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <CheckCircle size={48} color="#10B981" />
            </View>
            <Text style={styles.completionTitle}>Configuration terminée !</Text>
            <Text style={styles.completionText}>
              Votre base de données Supabase est maintenant configurée. 
              Vous pouvez commencer à utiliser Afea.
            </Text>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={onComplete}
            >
              <Text style={styles.finishButtonText}>Commencer à utiliser Afea</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpIcon}>
            <AlertCircle size={20} color="#EE7518" />
          </View>
          <Text style={styles.helpTitle}>Besoin d'aide ?</Text>
          <Text style={styles.helpText}>
            Si vous rencontrez des problèmes, vérifiez que :
          </Text>
          <Text style={styles.helpText}>
            • Votre projet Supabase est bien créé et actif
          </Text>
          <Text style={styles.helpText}>
            • Le script SQL a été exécuté sans erreurs
          </Text>
          <Text style={styles.helpText}>
            • Les variables d'environnement sont correctement configurées
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E2E1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EE7518',
    borderRadius: 2,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E2E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIconComplete: {
    backgroundColor: '#10B981',
  },
  stepIconCurrent: {
    backgroundColor: '#EE7518',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  stepContent: {
    paddingLeft: 56,
  },
  instructionsList: {
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EE7518',
    marginTop: 6,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  stepActions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completeButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  completionContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  completionIcon: {
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  finishButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  helpIcon: {
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
    marginBottom: 4,
  },
});