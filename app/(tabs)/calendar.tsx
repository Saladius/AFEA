import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Briefcase,
  Coffee,
  Dumbbell,
  Sparkles,
  Search
} from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Event, EventType, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: EventType;
  icon: string;
  status: EventStatus;
}

const eventTypeIcons = {
  casual: { icon: Coffee, emoji: '☕', color: '#10B981' },
  formal: { icon: Briefcase, emoji: '💼', color: '#3B82F6' },
  sport: { icon: Dumbbell, emoji: '🏃', color: '#F59E0B' },
  party: { icon: Sparkles, emoji: '🎉', color: '#EC4899' },
};

const statusConfig = {
  ready: { label: 'Tenue prête', color: '#10B981', emoji: '✅' },
  preparing: { label: 'À préparer', color: '#F59E0B', emoji: '⏰' },
  generate: { label: 'Générer tenue', color: '#EE7518', emoji: '✨' },
};

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, createEvent, fetchEvents } = useEvents();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all' as EventType | 'all',
    status: 'all' as EventStatus | 'all',
  });
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '09:00',
    location: '',
    event_type: 'casual',
    icon: '☕',
    status: 'preparing',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Get current week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.type === 'all' || event.event_type === filters.type;
    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => event.event_date === dateString);
  };

  // Get upcoming events
  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return filteredEvents
      .filter(event => event.event_date >= today)
      .sort((a, b) => {
        const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        if (dateCompare === 0) {
          return a.event_time.localeCompare(b.event_time);
        }
        return dateCompare;
      });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const handleAddEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'événement');
      return;
    }

    setFormLoading(true);
    try {
      await createEvent({
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location || null,
        event_type: formData.event_type,
        icon: formData.icon,
        status: formData.status,
      });

      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '09:00',
        location: '',
        event_type: 'casual',
        icon: '☕',
        status: 'preparing',
      });
      
      Alert.alert('Succès', 'Événement créé avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    } finally {
      setFormLoading(false);
    }
  };

  const formatEventTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  const renderEventCard = (event: Event, showDate: boolean = false) => {
    const typeConfig = eventTypeIcons[event.event_type];
    const status = statusConfig[event.status];

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => router.push(`/(tabs)/event-details?id=${event.id}`)}
      >
        <View style={styles.eventHeader}>
          <View style={[styles.eventTypeIcon, { backgroundColor: `${typeConfig.color}20` }]}>
            <Text style={styles.eventEmoji}>{typeConfig.emoji}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMeta}>
              <View style={styles.eventMetaItem}>
                <Clock size={12} color="#8E8E93" />
                <Text style={styles.eventMetaText}>
                  {showDate && `${formatEventDate(event.event_date)} • `}
                  {formatEventTime(event.event_time)}
                </Text>
              </View>
              {event.location && (
                <View style={styles.eventMetaItem}>
                  <MapPin size={12} color="#8E8E93" />
                  <Text style={styles.eventMetaText}>{event.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.eventFooter}>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
          <TouchableOpacity style={styles.outfitButton}>
            <Text style={styles.outfitButtonText}>Voir tenue</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Mon calendrier</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Filter size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('prev')}>
            <ChevronLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('next')}>
            <ChevronRight size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        {/* Week View */}
        <View style={styles.weekContainer}>
          {weekDates.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const hasEvents = dayEvents.length > 0;

            return (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayName}>{dayNames[index]}</Text>
                <TouchableOpacity
                  style={[
                    styles.dayNumber,
                    isToday && styles.dayNumberToday,
                    hasEvents && styles.dayNumberWithEvents,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayNumberText,
                    isToday && styles.dayNumberTextToday,
                    hasEvents && styles.dayNumberTextWithEvents,
                  ]}>
                    {date.getDate()}
                  </Text>
                  {hasEvents && (
                    <View style={styles.eventIndicator}>
                      <Text style={styles.eventCount}>{dayEvents.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Events for this day */}
                {hasEvents && (
                  <View style={styles.dayEvents}>
                    {dayEvents.slice(0, 2).map(event => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.miniEventCard,
                          { borderLeftColor: eventTypeIcons[event.event_type].color }
                        ]}
                        onPress={() => router.push(`/(tabs)/event-details?id=${event.id}`)}
                      >
                        <Text style={styles.miniEventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.miniEventTime}>
                          {formatEventTime(event.event_time)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {dayEvents.length > 2 && (
                      <Text style={styles.moreEvents}>+{dayEvents.length - 2} autres</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un événement..."
              placeholderTextColor="#C7C7CC"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Upcoming Events List */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>📋 Événements à venir</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EE7518" />
              <Text style={styles.loadingText}>Chargement des événements...</Text>
            </View>
          ) : getUpcomingEvents().length > 0 ? (
            <View style={styles.eventsList}>
              {getUpcomingEvents().map(event => renderEventCard(event, true))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#E5E2E1" />
              <Text style={styles.emptyTitle}>Aucun événement à venir</Text>
              <Text style={styles.emptySubtitle}>
                Créez votre premier événement pour commencer à planifier vos tenues
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Créer un événement</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvel événement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Event Type Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type d'événement</Text>
              <View style={styles.typeGrid}>
                {Object.entries(eventTypeIcons).map(([type, config]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeCard,
                      formData.event_type === type && styles.typeCardActive,
                      { borderColor: config.color }
                    ]}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      event_type: type as EventType,
                      icon: config.emoji 
                    }))}
                  >
                    <Text style={styles.typeEmoji}>{config.emoji}</Text>
                    <Text style={[
                      styles.typeLabel,
                      formData.event_type === type && { color: config.color }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Titre *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nom de l'événement"
                placeholderTextColor="#C7C7CC"
                value={formData.title}
                onChangeText={(title) => setFormData(prev => ({ ...prev, title }))}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Description de l'événement"
                placeholderTextColor="#C7C7CC"
                value={formData.description}
                onChangeText={(description) => setFormData(prev => ({ ...prev, description }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Date *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C7C7CC"
                  value={formData.event_date}
                  onChangeText={(event_date) => setFormData(prev => ({ ...prev, event_date }))}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.formLabel}>Heure *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="HH:MM"
                  placeholderTextColor="#C7C7CC"
                  value={formData.event_time}
                  onChangeText={(event_time) => setFormData(prev => ({ ...prev, event_time }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Lieu</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Lieu de l'événement"
                placeholderTextColor="#C7C7CC"
                value={formData.location}
                onChangeText={(location) => setFormData(prev => ({ ...prev, location }))}
              />
            </View>

            {/* Status Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Statut de la tenue</Text>
              <View style={styles.statusGrid}>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusCard,
                      formData.status === status && styles.statusCardActive,
                      { borderColor: config.color }
                    ]}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      status: status as EventStatus 
                    }))}
                  >
                    <Text style={styles.statusEmoji}>{config.emoji}</Text>
                    <Text style={[
                      styles.statusLabel,
                      formData.status === status && { color: config.color }
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, formLoading && styles.createButtonDisabled]}
              onPress={handleAddEvent}
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Type d'événement</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.type === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.type === 'all' && styles.filterOptionTextActive
                  ]}>
                    Tous
                  </Text>
                </TouchableOpacity>
                {Object.entries(eventTypeIcons).map(([type, config]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.type === type && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, type: type as EventType }))}
                  >
                    <Text style={styles.filterOptionEmoji}>{config.emoji}</Text>
                    <Text style={[
                      styles.filterOptionText,
                      filters.type === type && styles.filterOptionTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Statut de la tenue</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.status === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.status === 'all' && styles.filterOptionTextActive
                  ]}>
                    Tous
                  </Text>
                </TouchableOpacity>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.status === status && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: status as EventStatus }))}
                  >
                    <Text style={styles.filterOptionEmoji}>{config.emoji}</Text>
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === status && styles.filterOptionTextActive
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setFilters({ type: 'all', status: 'all' })}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },

  // Week Navigation
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Week View
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  dayNumberToday: {
    backgroundColor: '#EE7518',
  },
  dayNumberWithEvents: {
    backgroundColor: '#E5E2E1',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dayNumberTextToday: {
    color: '#FFFFFF',
  },
  dayNumberTextWithEvents: {
    color: '#1C1C1E',
  },
  eventIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayEvents: {
    width: '100%',
    gap: 4,
  },
  miniEventCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    padding: 6,
    borderLeftWidth: 3,
  },
  miniEventTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  miniEventTime: {
    fontSize: 9,
    color: '#8E8E93',
  },
  moreEvents: {
    fontSize: 9,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },

  // Upcoming Events
  upcomingSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventEmoji: {
    fontSize: 18,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventMeta: {
    gap: 4,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outfitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E5E2E1',
  },
  outfitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Form Styles
  formSection: {
    marginVertical: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  formHalf: {
    flex: 1,
  },

  // Type Selection
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  typeCardActive: {
    backgroundColor: '#FEF3E2',
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Status Selection
  statusGrid: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCardActive: {
    backgroundColor: '#FEF3E2',
  },
  statusEmoji: {
    fontSize: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Filter Styles
  filterSection: {
    marginVertical: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  filterOptionEmoji: {
    fontSize: 16,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});