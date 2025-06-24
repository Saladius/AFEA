import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { Event, EventType, EventStatus } from '@/types/database';
import { 
  Plus, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Filter,
  ChevronDown,
  Briefcase,
  Coffee,
  Dumbbell,
  Music,
  Settings
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CreateEventForm {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: EventType;
  icon: string;
}

interface FilterState {
  status: EventStatus | 'all';
  type: EventType | 'all';
  timeRange: 'all' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month';
}

const eventTypeIcons = {
  casual: '☕',
  formal: '💼', 
  sport: '🏃',
  party: '🎉'
};

const eventTypeColors = {
  casual: '#10B981',
  formal: '#3B82F6',
  sport: '#F59E0B',
  party: '#EC4899'
};

const statusColors = {
  ready: '#10B981',
  preparing: '#F59E0B', 
  generate: '#EE7518'
};

const statusLabels = {
  ready: 'Tenue prête',
  preparing: 'À préparer',
  generate: 'Générer tenue'
};

const statusButtonLabels = {
  ready: 'Voir tenue',
  preparing: 'Générer tenue',
  generate: 'Générer tenue'
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const { 
    events, 
    loading, 
    error, 
    createEvent, 
    updateEventStatus,
    getEventsForDate,
    getUpcomingEvents 
  } = useEvents();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    type: 'all',
    timeRange: 'all'
  });

  const [formData, setFormData] = useState<CreateEventForm>({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '12:00',
    location: '',
    event_type: 'casual',
    icon: eventTypeIcons.casual,
  });

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();

  // Filter events based on current filters
  const getFilteredEvents = () => {
    let filtered = [...events];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.event_type === filters.type);
    }

    // Filter by time range
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    switch (filters.timeRange) {
      case 'today':
        filtered = filtered.filter(event => event.event_date === today);
        break;
      case 'tomorrow':
        filtered = filtered.filter(event => event.event_date === tomorrowStr);
        break;
      case 'this_week':
        const weekStart = weekDates[0].toISOString().split('T')[0];
        const weekEnd = weekDates[6].toISOString().split('T')[0];
        filtered = filtered.filter(event => event.event_date >= weekStart && event.event_date <= weekEnd);
        break;
      case 'next_week':
        const nextWeekStart = new Date();
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = new Date();
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 13);
        filtered = filtered.filter(event => 
          event.event_date >= nextWeekStart.toISOString().split('T')[0] && 
          event.event_date <= nextWeekEnd.toISOString().split('T')[0]
        );
        break;
      case 'this_month':
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthEnd = new Date();
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        filtered = filtered.filter(event => 
          event.event_date >= monthStart.toISOString().split('T')[0] && 
          event.event_date <= monthEnd.toISOString().split('T')[0]
        );
        break;
    }

    // Sort by date and time
    return filtered.sort((a, b) => {
      const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      if (dateCompare === 0) {
        return a.event_time.localeCompare(b.event_time);
      }
      return dateCompare;
    });
  };

  const filteredEvents = getFilteredEvents();

  const handleCreateEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'événement');
      return;
    }

    try {
      await createEvent({
        ...formData,
        icon: eventTypeIcons[formData.event_type],
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '12:00',
        location: '',
        event_type: 'casual',
        icon: eventTypeIcons.casual,
      });

      setShowCreateModal(false);
      Alert.alert('Succès', 'Événement créé avec succès !');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la création de l\'événement');
    }
  };

  const handleStatusUpdate = async (eventId: string, newStatus: EventStatus) => {
    try {
      await updateEventStatus(eventId, newStatus);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour du statut');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Aujourd\'hui';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.timeRange !== 'all') count++;
    return count;
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      timeRange: 'all'
    });
  };

  const renderEventCard = (event: Event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIconContainer}>
          <Text style={styles.eventIcon}>{event.icon}</Text>
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>
            {formatTime(event.event_time)} - {formatTime(event.event_time.split(':').map((part, index) => 
              index === 0 ? String(parseInt(part) + 1).padStart(2, '0') : part
            ).join(':'))}
          </Text>
        </View>
      </View>
      
      <View style={styles.eventFooter}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: statusColors[event.status] }
        ]}>
          <Text style={styles.statusText}>{statusLabels[event.status]}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: event.status === 'ready' ? '#EE7518' : '#EE7518' }
          ]}
          onPress={() => {
            if (event.status === 'ready') {
              // Navigate to outfit view
              console.log('View outfit for event:', event.id);
            } else {
              handleStatusUpdate(event.id, 'ready');
            }
          }}
        >
          <Settings size={14} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {statusButtonLabels[event.status]}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Vous devez être connecté pour voir votre calendrier</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Mon calendrier</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Filter size={20} color="#EE7518" />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Weekly View */}
        <View style={styles.weeklySection}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weeklyScroll}
            contentContainerStyle={styles.weeklyContainer}
          >
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.dayCard,
                    isToday && styles.todayCard
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[
                    styles.dayName,
                    isToday && styles.todayText
                  ]}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isToday && styles.todayText
                  ]}>
                    {date.getDate()}
                  </Text>
                  
                  {dayEvents.length > 0 && (
                    <View style={styles.dayEventsContainer}>
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <View key={eventIndex} style={styles.dayEventDot}>
                          <Text style={styles.dayEventIcon}>{event.icon}</Text>
                          <Text style={styles.dayEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <Text style={styles.dayEventTime}>
                            {formatTime(event.event_time)}
                          </Text>
                        </View>
                      ))}
                      {dayEvents.length > 2 && (
                        <Text style={styles.moreEvents}>+{dayEvents.length - 2} autres</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>
              Tous les événements ({filteredEvents.length})
            </Text>
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity 
                style={styles.resetFiltersButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetFiltersText}>Réinitialiser</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#E5E2E1" />
              <Text style={styles.emptyTitle}>
                {events.length === 0 ? 'Aucun événement' : 'Aucun résultat'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {events.length === 0 
                  ? 'Créez votre premier événement pour commencer'
                  : 'Aucun événement ne correspond à vos filtres'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {filteredEvents.map(renderEventCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvel événement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'événement"
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description de l'événement"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="jj/mm/aaaa"
                  value={formData.event_date}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, event_date: text }))}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Heure</Text>
                <TextInput
                  style={styles.input}
                  placeholder="--:--"
                  value={formData.event_time}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, event_time: text }))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lieu</Text>
              <TextInput
                style={styles.input}
                placeholder="Lieu de l'événement"
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type d'événement</Text>
              <View style={styles.typeSelector}>
                {Object.entries(eventTypeIcons).map(([type, icon]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      formData.event_type === type && styles.typeOptionActive,
                      { borderColor: eventTypeColors[type as EventType] }
                    ]}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      event_type: type as EventType,
                      icon: icon
                    }))}
                  >
                    <Text style={styles.typeIcon}>{icon}</Text>
                    <Text style={[
                      styles.typeLabel,
                      formData.event_type === type && styles.typeLabelActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateEvent}
            >
              <Text style={styles.createButtonText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
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
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Statut</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'Tous les statuts' },
                  { key: 'ready', label: 'Tenue prête' },
                  { key: 'preparing', label: 'À préparer' },
                  { key: 'generate', label: 'Générer tenue' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      filters.status === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.key as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Type</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'Tous les types' },
                  { key: 'casual', label: 'Décontracté' },
                  { key: 'formal', label: 'Formel' },
                  { key: 'sport', label: 'Sport' },
                  { key: 'party', label: 'Soirée' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      filters.type === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, type: option.key as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.type === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Période</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'Toutes les dates' },
                  { key: 'today', label: 'Aujourd\'hui' },
                  { key: 'tomorrow', label: 'Demain' },
                  { key: 'this_week', label: 'Cette semaine' },
                  { key: 'next_week', label: 'Semaine prochaine' },
                  { key: 'this_month', label: 'Ce mois' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      filters.timeRange === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, timeRange: option.key as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.timeRange === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={resetFilters}
            >
              <Text style={styles.cancelButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.createButtonText}>Appliquer</Text>
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
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

  // Weekly Section
  weeklySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  weeklyScroll: {
    paddingLeft: 24,
  },
  weeklyContainer: {
    paddingRight: 24,
  },
  dayCard: {
    width: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  todayCard: {
    backgroundColor: '#EE7518',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  todayText: {
    color: '#FFFFFF',
  },
  dayEventsContainer: {
    width: '100%',
    gap: 4,
  },
  dayEventDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
  },
  dayEventIcon: {
    fontSize: 12,
  },
  dayEventTitle: {
    fontSize: 8,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  dayEventTime: {
    fontSize: 7,
    color: '#8E8E93',
  },
  moreEvents: {
    fontSize: 8,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },

  // Events Section
  eventsSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 24,
    flex: 1,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3E2',
    borderRadius: 8,
  },
  resetFiltersText: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
  },
  eventsList: {
    gap: 12,
  },

  // Event Card - Matching the exact design from the image
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  eventTime: {
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
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Loading and Empty States
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
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
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  typeOptionActive: {
    backgroundColor: '#FEF3E2',
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  typeLabelActive: {
    color: '#1C1C1E',
  },
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
    borderWidth: 1,
    borderColor: '#E5E2E1',
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
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Filter Modal
  filterSection: {
    marginBottom: 24,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  filterOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
});