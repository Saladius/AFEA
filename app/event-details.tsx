import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Coffee, Briefcase, Dumbbell, Heart, Trash2, CreditCard as Edit3, RefreshCw, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Event, EventType } from '@/types/database';

const { width } = Dimensions.get('window');
const outfitCardWidth = (width - 72) / 2; // 24px padding on each side + 24px gap

const eventTypeIcons = {
  casual: Coffee,
  formal: Briefcase,
  sport: Dumbbell,
  party: Heart,
};

const eventTypeColors = {
  casual: '#10B981',
  formal: '#3B82F6',
  sport: '#F59E0B',
  party: '#EC4899',
};

const statusColors = {
  ready: '#10B981',
  preparing: '#F59E0B',
  generate: '#8E8E93',
};

const statusLabels = {
  ready: 'Tenue prête',
  preparing: 'À préparer',
  generate: 'Générer tenue',
};

// Dummy outfit suggestions for the 4x2 grid
const dummyOutfits = [
  {
    id: 1,
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Tenue élégante',
    category: 'Formal'
  },
  {
    id: 2,
    image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Look décontracté',
    category: 'Casual'
  },
  {
    id: 3,
    image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Style chic',
    category: 'Smart Casual'
  },
  {
    id: 4,
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Tenue moderne',
    category: 'Contemporary'
  },
  {
    id: 5,
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Look sophistiqué',
    category: 'Elegant'
  },
  {
    id: 6,
    image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Style urbain',
    category: 'Urban'
  },
  {
    id: 7,
    image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Tenue classique',
    category: 'Classic'
  },
  {
    id: 8,
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
    title: 'Look tendance',
    category: 'Trendy'
  },
];

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { events, loading, error, fetchEvents, deleteEvent, updateEventStatus } = useEvents();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [refreshingOutfits, setRefreshingOutfits] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchEvents();
    }
  }, [user, id]);

  useEffect(() => {
    if (events.length > 0 && id) {
      const foundEvent = events.find(e => e.id === id);
      setEvent(foundEvent || null);
    }
  }, [events, id]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (timeString: string): string => {
    return timeString.slice(0, 5); // Remove seconds
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    
    Alert.alert(
      'Supprimer l\'événement',
      `Êtes-vous sûr de vouloir supprimer "${event.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              Alert.alert('Succès', 'Événement supprimé avec succès.');
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'événement.');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: 'ready' | 'preparing' | 'generate') => {
    if (!event) return;
    
    try {
      await updateEventStatus(event.id, newStatus);
      setEvent({ ...event, status: newStatus });
      Alert.alert('Succès', 'Statut mis à jour avec succès.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
    }
  };

  const handleRefreshOutfits = () => {
    setRefreshingOutfits(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshingOutfits(false);
      Alert.alert('Succès', 'Nouvelles suggestions de tenues générées !');
    }, 2000);
  };

  const handleOutfitPress = (outfit: any) => {
    Alert.alert('Tenue sélectionnée', `Vous avez sélectionné : ${outfit.title}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de l'événement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Événement introuvable</Text>
          <Text style={styles.errorText}>L'événement que vous recherchez n'existe pas ou a été supprimé.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const IconComponent = eventTypeIcons[event.event_type];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de l'événement</Text>
          <TouchableOpacity style={styles.headerDeleteButton} onPress={handleDeleteEvent}>
            <Trash2 size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={[
              styles.eventIcon,
              { backgroundColor: eventTypeColors[event.event_type] }
            ]}>
              <IconComponent size={24} color="#FFFFFF" />
            </View>
            <View style={styles.eventTitleContainer}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventDateTime}>
                <Calendar size={16} color="#8E8E93" />
                <Text style={styles.eventDateText}>
                  {formatDate(event.event_date)} • {formatTime(event.event_time)}
                </Text>
              </View>
              {event.location && (
                <View style={styles.eventLocation}>
                  <MapPin size={16} color="#8E8E93" />
                  <Text style={styles.eventLocationText}>{event.location}</Text>
                </View>
              )}
            </View>
          </View>

          {event.description && (
            <View style={styles.eventDescription}>
              <Text style={styles.eventDescriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusColors[event.status] }
            ]}>
              <Text style={styles.statusText}>{statusLabels[event.status]}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color="#EE7518" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Outfit Suggestions Section */}
        <View style={styles.outfitsSection}>
          <View style={styles.outfitsHeader}>
            <Text style={styles.outfitsTitle}>Tenue suggérée</Text>
            <View style={styles.outfitsActions}>
              <TouchableOpacity
                style={[styles.refreshButton, refreshingOutfits && styles.refreshButtonActive]}
                onPress={handleRefreshOutfits}
                disabled={refreshingOutfits}
              >
                <RefreshCw 
                  size={20} 
                  color="#EE7518" 
                  style={refreshingOutfits ? styles.spinning : undefined}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 4x2 Outfit Grid */}
          <View style={styles.outfitsGrid}>
            {dummyOutfits.map((outfit) => (
              <TouchableOpacity
                key={outfit.id}
                style={[styles.outfitCard, { width: outfitCardWidth }]}
                onPress={() => handleOutfitPress(outfit)}
              >
                <Image source={{ uri: outfit.image }} style={styles.outfitImage} />
                <View style={styles.outfitInfo}>
                  <Text style={styles.outfitTitle} numberOfLines={1}>
                    {outfit.title}
                  </Text>
                  <Text style={styles.outfitCategory} numberOfLines={1}>
                    {outfit.category}
                  </Text>
                </View>
                <TouchableOpacity style={styles.outfitMoreButton}>
                  <MoreHorizontal size={16} color="#8E8E93" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                event.status === 'generate' && styles.actionButtonActive
              ]}
              onPress={() => handleStatusChange('generate')}
            >
              <Text style={[
                styles.actionButtonText,
                event.status === 'generate' && styles.actionButtonTextActive
              ]}>
                Générer tenue
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                event.status === 'preparing' && styles.actionButtonActive
              ]}
              onPress={() => handleStatusChange('preparing')}
            >
              <Text style={[
                styles.actionButtonText,
                event.status === 'preparing' && styles.actionButtonTextActive
              ]}>
                À préparer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                event.status === 'ready' && styles.actionButtonActive
              ]}
              onPress={() => handleStatusChange('ready')}
            >
              <Text style={[
                styles.actionButtonText,
                event.status === 'ready' && styles.actionButtonTextActive
              ]}>
                Tenue prête
              </Text>
            </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
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
  eventIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventDateText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventLocationText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eventDescription: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventDescriptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Outfits Section
  outfitsSection: {
    marginBottom: 24,
  },
  outfitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  outfitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  outfitsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonActive: {
    backgroundColor: '#EE7518',
  },
  spinning: {
    // Add rotation animation if needed
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Outfits Grid
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
    position: 'relative',
  },
  outfitImage: {
    width: '100%',
    height: outfitCardWidth * 1.3,
    resizeMode: 'cover',
  },
  outfitInfo: {
    padding: 12,
  },
  outfitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  outfitCategory: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  outfitMoreButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Actions Section
  actionsSection: {
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
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: '#FEF3E2',
    borderColor: '#EE7518',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionButtonTextActive: {
    color: '#EE7518',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});