import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEvents } from '@/hooks/useEvents';
import { Event, EventType, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');

interface Filters {
  status: EventStatus | 'all';
  type: EventType | 'all';
  timeRange: 'all' | 'today' | 'tomorrow' | 'week' | 'next_week' | 'month';
}

const eventTypeOptions: { key: EventType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Tous les types', icon: '📅' },
  { key: 'casual', label: 'Décontracté', icon: '👕' },
  { key: 'formal', label: 'Formel', icon: '👔' },
  { key: 'sport', label: 'Sport', icon: '🏃‍♂️' },
  { key: 'party', label: 'Soirée', icon: '🎉' },
];

const statusOptions: { key: EventStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Tous les statuts', color: '#8E8E93' },
  { key: 'ready', label: 'Tenue prête', color: '#10B981' },
  { key: 'preparing', label: 'À préparer', color: '#F59E0B' },
  { key: 'generate', label: 'Générer tenue', color: '#EE7518' },
];

const timeRangeOptions: { key: string; label: string }[] = [
  { key: 'all', label: 'Toutes les dates' },
  { key: 'today', label: 'Aujourd\'hui' },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'next_week', label: 'Semaine prochaine' },
  { key: 'month', label: 'Ce mois' },
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
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Aujourd\'hui';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Demain';
  } else {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString('fr-FR', options);
  }
};

const formatTime = (timeString: string): string => {
  return timeString.slice(0, 5); // Remove seconds if present
};

const getWeekDates = (): Date[] => {
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay + 1); // Monday

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
};

export default function CalendarScreen() {
  const router = useRouter();
  const { events, createEvent, loading, fetchEvents } = useEvents();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('casual');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    type: 'all',
    timeRange: 'all'
  });

  const [activeFilters, setActiveFilters] = useState<Filters>({
    status: 'all',
    type: 'all',
    timeRange: 'all'
  });

  const weekDates = getWeekDates().map(date => {
    const offsetDate = new Date(date);
    offsetDate.setDate(date.getDate() + (currentWeekOffset * 7));
    return offsetDate;
  });

  const filteredEvents = events.filter(event => {
    // Status filter
    if (activeFilters.status !== 'all' && event.status !== activeFilters.status) {
      return false;
    }

    // Type filter
    if (activeFilters.type !== 'all' && event.event_type !== activeFilters.type) {
      return false;
    }

    // Time range filter
    if (activeFilters.timeRange !== 'all') {
      const eventDate = new Date(event.event_date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      switch (activeFilters.timeRange) {
        case 'today':
          if (eventDate.toDateString() !== today.toDateString()) return false;
          break;
        case 'tomorrow':
          if (eventDate.toDateString() !== tomorrow.toDateString()) return false;
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          if (eventDate < weekStart || eventDate > weekEnd) return false;
          break;
        case 'next_week':
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() - today.getDay() + 8);
          const nextWeekEnd = new Date(nextWeekStart);
          nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
          if (eventDate < nextWeekStart || eventDate > nextWeekEnd) return false;
          break;
        case 'month':
          if (eventDate.getMonth() !== today.getMonth() || eventDate.getFullYear() !== today.getFullYear()) return false;
          break;
      }
    }

    return true;
  });

  const getEventsForDate = (date: Date): Event[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateString);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchEvents();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setLocation('');
    setEventType('casual');
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'événement');
      return;
    }

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        event_date: selectedDate.toISOString().split('T')[0],
        event_time: selectedTime.toTimeString().slice(0, 5),
        location: location.trim() || null,
        event_type: eventType,
        icon: getEventTypeIcon(eventType),
        status: 'generate' as EventStatus,
      };

      await createEvent(eventData);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Succès', 'Événement créé avec succès !');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    }
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setShowFiltersModal(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      status: 'all' as const,
      type: 'all' as const,
      timeRange: 'all' as const
    };
    setFilters(resetFilters);
    setActiveFilters(resetFilters);
  };

  const hasActiveFilters = activeFilters.status !== 'all' || activeFilters.type !== 'all' || activeFilters.timeRange !== 'all';

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (activeFilters.status !== 'all') count++;
    if (activeFilters.type !== 'all') count++;
    if (activeFilters.timeRange !== 'all') count++;
    return count;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Événements</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              hasActiveFilters && styles.filterButtonActive
            ]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Filter size={20} color={hasActiveFilters ? "#FFFFFF" : "#EE7518"} />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EE7518"
            colors={['#EE7518']}
          />
        }
      >
        {/* Weekly View */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>
            <View style={styles.weekNavigation}>
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              >
                <ChevronLeft size={20} color="#8E8E93" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              >
                <ChevronRight size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weeklyScroll}
            contentContainerStyle={styles.weeklyContainer}
          >
            {weekDates.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <View key={index} style={styles.dayCard}>
                  <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
                    <Text style={[styles.dayName, isToday && styles.todayText]}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  
                  <View style={styles.dayEvents}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.weekEventCard}
                        onPress={() => router.push(`/event/${event.id}`)}
                      >
                        <Text style={styles.weekEventIcon}>{event.icon}</Text>
                        <Text style={styles.weekEventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.weekEventTime}>
                          {formatTime(event.event_time)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    {dayEvents.length > 2 && (
                      <Text style={styles.moreEventsText}>
                        +{dayEvents.length - 2} autres
                      </Text>
                    )}
                    
                    {dayEvents.length === 0 && (
                      <Text style={styles.noEventsText}>Aucun événement</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersSection}>
            <Text style={styles.activeFiltersTitle}>Filtres actifs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFiltersContainer}>
                {activeFilters.status !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {statusOptions.find(s => s.key === activeFilters.status)?.label}
                    </Text>
                  </View>
                )}
                {activeFilters.type !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {eventTypeOptions.find(t => t.key === activeFilters.type)?.label}
                    </Text>
                  </View>
                )}
                {activeFilters.timeRange !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {timeRangeOptions.find(t => t.key === activeFilters.timeRange)?.label}
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={styles.resetFiltersChip} onPress={resetFilters}>
                  <Text style={styles.resetFiltersText}>Réinitialiser</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Events List */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>
              Tous les événements ({filteredEvents.length})
            </Text>
          </View>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {hasActiveFilters ? 'Aucun événement trouvé' : 'Aucun événement'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {hasActiveFilters 
                  ? 'Essayez de modifier vos filtres'
                  : 'Créez votre premier événement pour commencer'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {filteredEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/event/${event.id}`)}
                >
                  <View style={styles.eventCardHeader}>
                    <View style={styles.eventIconContainer}>
                      <Text style={styles.eventIcon}>{event.icon}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDateTime}>
                        {formatDate(event.event_date)} • {formatTime(event.event_time)}
                      </Text>
                      {event.location && (
                        <View style={styles.eventLocationContainer}>
                          <MapPin size={14} color="#8E8E93" />
                          <Text style={styles.eventLocation}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.eventCardFooter}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(event.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(event.status) }
                      ]}>
                        {getStatusText(event.status)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity style={styles.outfitButton}>
                      <Text style={styles.outfitButtonText}>Voir tenue</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel événement</Text>
            <TouchableOpacity onPress={handleCreateEvent}>
              <Text style={styles.saveButton}>Créer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Titre *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nom de l'événement"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description de l'événement"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Date and Time */}
            <View style={styles.dateTimeRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <CalendarIcon size={20} color="#8E8E93" />
                  <Text style={styles.dateTimeText}>
                    {selectedDate.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Heure</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color="#8E8E93" />
                  <Text style={styles.dateTimeText}>
                    {selectedTime.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lieu</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Lieu de l'événement"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Event Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type d'événement</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeOptions}>
                  {eventTypeOptions.slice(1).map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.typeOption,
                        eventType === option.key && styles.typeOptionActive
                      ]}
                      onPress={() => setEventType(option.key as EventType)}
                    >
                      <Text style={styles.typeOptionIcon}>{option.icon}</Text>
                      <Text style={[
                        styles.typeOptionText,
                        eventType === option.key && styles.typeOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) setSelectedTime(time);
              }}
            />
          )}
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
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity onPress={applyFilters}>
              <Text style={styles.saveButton}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Statut</Text>
              <View style={styles.filterOptions}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      filters.status === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.key }))}
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
              <Text style={styles.filterSectionTitle}>Type</Text>
              <View style={styles.filterOptions}>
                {eventTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      filters.type === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, type: option.key }))}
                  >
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
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
              <Text style={styles.filterSectionTitle}>Période</Text>
              <View style={styles.filterOptions}>
                {timeRangeOptions.map((option) => (
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

            {/* Reset Button */}
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Réinitialiser tous les filtres</Text>
            </TouchableOpacity>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#EE7518',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  weekNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  weekNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  weeklyScroll: {
    paddingLeft: 24,
  },
  weeklyContainer: {
    gap: 12,
    paddingRight: 24,
  },
  dayCard: {
    width: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  dayHeader: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayHeader: {
    backgroundColor: '#EE7518',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
  },
  todayText: {
    color: '#FFFFFF',
  },
  dayEvents: {
    gap: 6,
  },
  weekEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EE7518',
  },
  weekEventIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  weekEventTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  weekEventTime: {
    fontSize: 10,
    color: '#8E8E93',
  },
  moreEventsText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noEventsText: {
    fontSize: 10,
    color: '#C7C7CC',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Active Filters
  activeFiltersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  resetFiltersChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  resetFiltersText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },

  // Events Section
  eventsSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  eventsHeader: {
    marginBottom: 20,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EE7518',
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIcon: {
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
  eventDateTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#8E8E93',
  },
  eventCardFooter: {
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
  },
  outfitButton: {
    backgroundColor: '#EE7518',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outfitButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveButton: {
    fontSize: 16,
    color: '#EE7518',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    gap: 8,
  },
  typeOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  typeOptionIcon: {
    fontSize: 16,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },

  // Filter Styles
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    gap: 8,
  },
  filterOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  filterOptionIcon: {
    fontSize: 16,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
});