import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Calendar, MapPin, Clock, CreditCard as Edit3, RefreshCw, Heart } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useClothes } from '@/hooks/useClothes';
import { Event, ClothingItem } from '@/types/database';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { events, updateEventStatus, deleteEvent } = useEvents();
  const { clothes } = useClothes();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [suggestedOutfit, setSuggestedOutfit] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const handleLike = (itemId: string) => {
  // Dummy outfit items for complete outfit display
  const dummyOutfitItems = [
    {
      id: 'dummy-1',
      image_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
      type: 'top' as const,
      name: 'T-shirt blanc'
    },
    {
      id: 'dummy-2', 
      image_url: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
      type: 'bottom' as const,
      name: 'Jean bleu'
    },
    {
      id: 'dummy-3',
      image_url: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
      type: 'shoes' as const,
      name: 'Baskets blanches'
    },
    {
      id: 'dummy-4',
      image_url: 'https://images.pexels.com/photos/1040944/pexels-photo-1040944.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1',
      type: 'accessories' as const,
      name: 'Montre'
    }
  ];

    setLikedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  useEffect(() => {
    if (id && events.length > 0) {
      const foundEvent = events.find(e => e.id === id);
      if (foundEvent) {
        setEvent(foundEvent);
        generateSuggestedOutfit(foundEvent);
      }
    }
  }, [id, events]);

  const generateSuggestedOutfit = (eventData: Event) => {
    // For now, always show the complete dummy outfit
    // In a real app, this would combine user's clothes with suggestions
    setSuggestedOutfit(dummyOutfitItems as any);
  };


  const handleStatusUpdate = async (newStatus: 'ready' | 'preparing' | 'generate') => {
    if (!event) return;

    setLoading(true);
    try {
      await updateEventStatus(event.id, newStatus);
      setEvent(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = () => {
    if (!event) return;

    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Tenue prête',
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
          icon: '✓'
        };
      case 'preparing':
        return {
          label: 'À préparer',
          backgroundColor: '#F59E0B',
          textColor: '#FFFFFF',
          icon: '⏰'
        };
      case 'generate':
        return {
          label: 'Générer tenue',
          backgroundColor: '#EE7518',
          textColor: '#FFFFFF',
          icon: '✨'
        };
      default:
        return {
          label: 'À préparer',
          backgroundColor: '#F59E0B',
          textColor: '#FFFFFF',
          icon: '⏰'
        };
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'formal':
        return '🎩';
      case 'sport':
        return '🏃';
      case 'party':
        return '🎉';
      case 'casual':
      default:
        return '🍽️';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de l'événement</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(event.status);

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
        {/* Event Card */}
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
                    {formatDate(event.event_date)} • {event.event_time}
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
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}
              onPress={() => {
                // Cycle through statuses
                const statuses: ('ready' | 'preparing' | 'generate')[] = ['preparing', 'ready', 'generate'];
                const currentIndex = statuses.indexOf(event.status as any);
                const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                handleStatusUpdate(nextStatus);
              }}
              disabled={loading}
            >
              <Clock size={16} color={statusConfig.textColor} />
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={20} color="#EE7518" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Suggested Outfit Section */}
        <View style={styles.outfitSection}>
          <View style={styles.outfitHeader}>
            <Text style={styles.outfitTitle}>Tenue suggérée</Text>
            <View style={styles.outfitActions}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => generateSuggestedOutfit(event)}
              >
                <RefreshCw size={20} color="#EE7518" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {dummyOutfitItems.length > 0 ? (
            <View style={styles.outfitGrid}>
              {dummyOutfitItems.map((item, index) => (
                <View key={item.id} style={styles.outfitItem}>
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.outfitImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity style={styles.itemFavoriteButton} onPress={() => handleLike(item.id)}>
                    <Heart size={20} color={likedItems.includes(item.id) ? "#EF4444" : "#8E8E93"} />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemType} numberOfLines={1}>
                      {item.type}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyOutfit}>
              <Text style={styles.emptyOutfitText}>
                Aucune tenue suggérée disponible
              </Text>
              <Text style={styles.emptyOutfitSubtext}>
                Ajoutez des vêtements à votre garde-robe pour obtenir des suggestions
              </Text>
            </View>
          )}
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
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
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventIcon: {
    fontSize: 28,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 24,
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
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemFavoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemType: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outfitItem: {
    width: (width - 96) / 2, // Account for padding and gap
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  emptyOutfit: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyOutfitText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyOutfitSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});