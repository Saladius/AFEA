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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Calendar, MapPin, Clock, Edit, RefreshCw, Heart, X, Check } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useClothes } from '@/hooks/useClothes';
import { Event, ClothingItem } from '@/types/database';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { events, updateEventStatus, deleteEvent, updateEvent } = useEvents();
  const { clothes } = useClothes();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [suggestedOutfit, setSuggestedOutfit] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    event_type: 'casual' as 'casual' | 'formal' | 'sport' | 'party',
    icon: '📅',
  });
  const [saving, setSaving] = useState(false);
  const handleLike = (itemId: string) => {
    setLikedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  useEffect(() => {
    if (id && events.length > 0) {
      const foundEvent = events.find(e => e.id === id);
      if (foundEvent) {
        setEvent(foundEvent);
        // Initialize edit form with current event data
        setEditForm({
          title: foundEvent.title,
          description: foundEvent.description || '',
          event_date: foundEvent.event_date,
          event_time: foundEvent.event_time,
          location: foundEvent.location || '',
          event_type: foundEvent.event_type,
          icon: foundEvent.icon,
        });
        generateSuggestedOutfit(foundEvent);
      }
    }
  }, [id, events]);

  const generateSuggestedOutfit = (eventData: Event) => {
    // Simple outfit suggestion based on event type
    const filteredClothes = clothes.filter(item => {
      if (eventData.event_type === 'formal') {
        return item.style === 'formal' || item.style === 'chic';
      } else if (eventData.event_type === 'sport') {
        return item.style === 'sport';
      } else if (eventData.event_type === 'party') {
        return item.style === 'chic' || item.style === 'formal';
      } else {
        return item.style === 'casual';
      }
    });

    // Select up to 4 items for the outfit
    const outfit = filteredClothes.slice(0, 4);
    setSuggestedOutfit(outfit);
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

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!event) return;

    if (!editForm.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const updatedEvent = await updateEvent(event.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        event_date: editForm.event_date,
        event_time: editForm.event_time,
        location: editForm.location.trim() || null,
        event_type: editForm.event_type,
        icon: editForm.icon,
      });
      
      setEvent(updatedEvent);
      setShowEditModal(false);
      Alert.alert('Succès', 'Événement mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'événement');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (event) {
      setEditForm({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location || '',
        event_type: event.event_type,
        icon: event.icon,
      });
    }
    setShowEditModal(false);
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

            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Edit size={20} color="#EE7518" />
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

          {suggestedOutfit.length > 0 ? (
            <View style={styles.outfitGrid}>
              {suggestedOutfit.map((item, index) => (
                <View key={item.id} style={styles.outfitItem}>
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.outfitImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity style={styles.itemFavoriteButton} onPress={() => handleLike(item.id)}>
                    <Heart size={20} color={likedItems.includes(item.id) ? "#EF4444" : "#8E8E93"} />
                  </TouchableOpacity>
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

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={handleCancel}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modifier l'événement</Text>
            <TouchableOpacity 
              style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              <Check size={24} color="#EE7518" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Titre *</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.title}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                placeholder="Titre de l'événement"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                placeholder="Description de l'événement"
                placeholderTextColor="#C7C7CC"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date *</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.event_date}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, event_date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Heure *</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.event_time}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, event_time: text }))}
                placeholder="HH:MM"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Lieu</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.location}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
                placeholder="Lieu de l'événement"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Event Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type d'événement</Text>
              <View style={styles.eventTypeContainer}>
                {(['casual', 'formal', 'sport', 'party'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.eventTypeButton,
                      editForm.event_type === type && styles.eventTypeButtonActive
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, event_type: type }))}
                  >
                    <Text style={[
                      styles.eventTypeText,
                      editForm.event_type === type && styles.eventTypeTextActive
                    ]}>
                      {type === 'casual' ? 'Décontracté' : 
                       type === 'formal' ? 'Formel' : 
                       type === 'sport' ? 'Sport' : 'Fête'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Icône</Text>
              <View style={styles.iconContainer}>
                {['📅', '🍽️', '🎉', '🏃', '🎩', '💼', '🎵', '🎬'].map((iconOption) => (
                  <TouchableOpacity
                    key={iconOption}
                    style={[
                      styles.iconButton,
                      editForm.icon === iconOption && styles.iconButtonActive
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, icon: iconOption }))}
                  >
                    <Text style={styles.iconText}>{iconOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },

  // Form Styles
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  eventTypeButtonActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  eventTypeText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eventTypeTextActive: {
    color: '#FFFFFF',
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#FEF3E2',
    borderColor: '#EE7518',
  },
  iconText: {
    fontSize: 24,
  },
  emptyOutfitSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});