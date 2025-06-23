import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { outfitService } from '@/services/outfit';
import { OutfitSuggestion } from '@/types/database';
import OutfitDisplay from '@/components/OutfitDisplay';
import { Sparkles, Calendar, Shuffle, Coffee, Briefcase, Dumbbell, Heart, Clock, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OutfitScreen() {
  const { user } = useAuth();
  const [outfit, setOutfit] = useState<OutfitSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState<'casual' | 'formal' | 'workout' | 'date' | 'business' | 'party'>('casual');

  const generateOutfit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const newOutfit = await outfitService.generateOutfitSuggestion(user.id, occasion);
      setOutfit(newOutfit);
    } catch (error) {
      console.error('Error generating outfit:', error);
    } finally {
      setLoading(false);
    }
  };

  const occasions = [
    { key: 'casual', label: 'Décontracté', icon: Coffee, color: '#10B981', description: 'Confort au quotidien' },
    { key: 'business', label: 'Professionnel', icon: Briefcase, color: '#3B82F6', description: 'Réunions & bureau' },
    { key: 'formal', label: 'Élégant', icon: Star, color: '#8B5CF6', description: 'Événements spéciaux' },
    { key: 'workout', label: 'Sport', icon: Dumbbell, color: '#F59E0B', description: 'Activités physiques' },
    { key: 'date', label: 'Rendez-vous', icon: Heart, color: '#EF4444', description: 'Soirées romantiques' },
    { key: 'party', label: 'Fête', icon: Sparkles, color: '#EC4899', description: 'Sorties & célébrations' },
  ] as const;

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>✨ Générateur de tenues</Text>
          <Text style={styles.subtitle}>
            Suggestions personnalisées alimentées par l'IA
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Clock size={20} color="#EE7518" />
            <Text style={styles.statText}>Instantané</Text>
          </View>
          <View style={styles.statItem}>
            <Sparkles size={20} color="#EE7518" />
            <Text style={styles.statText}>IA Avancée</Text>
          </View>
          <View style={styles.statItem}>
            <Star size={20} color="#EE7518" />
            <Text style={styles.statText}>Personnalisé</Text>
          </View>
        </View>

        {/* Occasion Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Choisissez l'occasion</Text>
          <View style={styles.occasionsGrid}>
            {occasions.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.occasionCard,
                  occasion === item.key && styles.occasionCardActive,
                ]}
                onPress={() => setOccasion(item.key)}
              >
                <View style={[
                  styles.occasionIcon,
                  { backgroundColor: occasion === item.key ? item.color : `${item.color}20` }
                ]}>
                  <item.icon
                    size={24}
                    color={occasion === item.key ? '#FFFFFF' : item.color}
                  />
                </View>
                <Text style={styles.occasionLabel}>{item.label}</Text>
                <Text style={styles.occasionDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateOutfit}
          disabled={loading}
        >
          <View style={styles.generateButtonContent}>
          {loading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.generateButtonText}>Génération en cours...</Text>
              </>
          ) : (
            <>
              <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Générer ma tenue</Text>
            </>
          )}
          </View>
        </TouchableOpacity>

        {/* Current Outfit Display */}
        {outfit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👗 Votre tenue</Text>
            <OutfitDisplay
              outfit={outfit}
              loading={loading}
              onRefresh={generateOutfit}
            />
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Conseils stylistiques</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Astuce du jour</Text>
              <Text style={styles.tipText}>
                Mélangez les textures pour créer de la profondeur dans vos tenues
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Tendance</Text>
              <Text style={styles.tipText}>
                Les couleurs neutres sont parfaites pour créer une base polyvalente
              </Text>
            </View>
          </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  occasionsGrid: {
    gap: 12,
  },
  occasionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  occasionCardActive: {
    borderColor: '#EE7518',
    backgroundColor: '#FEF3E2',
  },
  occasionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  occasionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    flex: 1,
  },
  occasionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EE7518',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EE7518',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
});