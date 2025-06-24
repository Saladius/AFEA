import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, CreditCard as Edit3, RefreshCw, Heart, Calendar, MapPin, Clock } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { Event, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');
const gridItemWidth = (width - 72) / 2; // 24px padding on each side + 24px gap

// Static outfit suggestions data
const outfitSuggestions = [
  {
    id: '1',
    name: 'Blouse élégante',
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Top'
  },
  {
    id: '2',
    name: 'Jupe noire',
    image: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Bottom'
  },
  {
    id: '3',
    name: 'Talons élégants',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Shoes'
  },
  {
    id: '4',
    name: 'Collier délicat',
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Accessories'
  }
];

const getEventTypeIcon = (type: string): string => {
  const iconMap: { [key: string]: string } = {
    'casual': '👕',
    'formal': '👔',
    'sport': '🏃‍♂️',
    'party': '🎉',
  };
  return iconMap[type] || '📅';
};

const getStatusColor = (status: EventStatus): string => {
  const colorMap: { [key: string]: string } = {
    'ready': '#10B981',
    'preparing': '#F59E0B',
    'generate': '#EE7518',
  };
  return colorMap[status] || '#8E8E93';
};

const getStatusText = (status: EventStatus): string => {
  const textMap: { [key: string]: string } = {
    'ready': 'Tenue prête',
    'preparing': 'À préparer',
    'generate': 'Générer tenue',
  };
  return textMap[status] || status;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  };
  return date.toLocaleDateString('fr-FR', options);
};

const formatTime = (timeString: string): string => {
  return timeString.slice(0, 5); // Remove seconds if present
};

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { events, deleteEvent, updateEventStatus, loading } = useEvents();
  const [event, setEvent] = useState<Event | null>(null);
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);

  useEffect(() => {
    if (id && events.length > 0) {
      const foundEvent = events.find(e => e.id === id);
      setEvent(foundEvent || null);
    }
  }, [id, events]);

  const handleDeleteEvent = () => {
    if (!event) return;

    Alert.alert(
      'Supprimer l\'événement',
      `Êtes-vous sûr de vouloir supprimer "${event.title}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
            }
          },
        },
      ]
    );
  };

  const handleGenerateOutfit = async () => {
    if (!event) return;

    setIsGeneratingOutfit(true);
    try {
      // Simulate outfit generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update status to ready
      await updateEventStatus(event.id, 'ready');
      
      // Update local state
      setEvent(prev => prev ? { ...prev, status: 'ready' } : null);
      
      Alert.alert('Succès', 'Votre tenue a été générée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer la tenue');
    } finally {
      setIsGeneratingOutfit(false);
    }
  };

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (!event) return;

    try {
      await updateEventStatus(event.id, newStatus);
      setEvent(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Événement introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de l'événement</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
          <Trash2 size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventIconContainer}>
              <Text style={styles.eventIcon}>{getEventTypeIcon(event.event_type)}</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventDetails}>
                <View style={styles.eventDetailRow}>
                  <Calendar size={16} color="#8E8E93" />
                  <Text style={styles.eventDetailText}>
                    {formatDate(event.event_date)} • {formatTime(event.event_time)}
                  </Text>
                </View>
                {event.location && (
                  <View style={styles.eventDetailRow}>
                    <MapPin size={16} color="#8E8E93" />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(event.status) + '20' }
              ]}
              onPress={() => {
                // Show status options
                Alert.alert(
                  'Changer le statut',
                  'Sélectionnez un nouveau statut',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Tenue prête', onPress: () => handleStatusChange('ready') },
                    { text: 'À préparer', onPress: () => handleStatusChange('preparing') },
                    { text: 'Générer tenue', onPress: () => handleStatusChange('generate') },
                  ]
                );
              }}
            >
              <Clock size={16} color={getStatusColor(event.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                {getStatusText(event.status)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color="#EE7518" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Outfit Suggestions Section */}
        <View style={styles.outfitSection}>
          <View style={styles.outfitHeader}>
            <Text style={styles.outfitTitle}>Tenue suggérée</Text>
            <View style={styles.outfitActions}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleGenerateOutfit}
                disabled={isGeneratingOutfit}
              >
                <RefreshCw 
                  size={20} 
                  color="#EE7518" 
                  style={isGeneratingOutfit ? styles.spinning : undefined}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart size={20} color="#EE7518" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Outfit Grid */}
          <View style={styles.outfitGrid}>
            {outfitSuggestions.map((item) => (
              <View key={item.id} style={[styles.outfitItem, { width: gridItemWidth }]}>
                <View style={styles.outfitImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.outfitImage} />
                </View>
                <Text style={styles.outfitItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.outfitItemCategory}>
                  {item.category}
                </Text>
              </View>
            ))}
          </View>

          {/* Generate Outfit Button */}
          {event.status === 'generate' && (
            <TouchableOpacity
              style={[
                styles.generateButton,
                isGeneratingOutfit && styles.generateButtonDisabled
              ]}
              onPress={handleGenerateOutfit}
              disabled={isGeneratingOutfit}
            >
              <Text style={styles.generateButtonText}>
                {isGeneratingOutfit ? 'Génération en cours...' : 'Générer ma tenue'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },

  // Event Card
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventIcon: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Outfit Section
  outfitSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  outfitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  outfitActions: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
    // Add rotation animation if needed
  },

  // Outfit Grid
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  outfitItem: {
    alignItems: 'center',
  },
  outfitImageContainer: {
    width: '100%',
    height: gridItemWidth * 1.2,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
    marginBottom: 8,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  outfitItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 2,
  },
  outfitItemCategory: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Generate Button
  generateButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 40,
  },
});