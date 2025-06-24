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
  Platform,
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
  ChevronRight,
  Briefcase,
  Coffee,
  Dumbbell,
  Music
} from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Event, EventType, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');

interface NewEvent {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: EventType;
  icon: string;
  status: EventStatus;
}

const eventTypes = [
  { key: 'casual', label: 'Décontracté', icon: Coffee, color: '#10B981' },
  { key: 'formal', label: 'Formel', icon: Briefcase, color: '#3B82F6' },
  { key: 'sport', label: 'Sport', icon: Dumbbell, color: '#F59E0B' },
  { key: 'party', label: 'Soirée', icon: Music, color: '#EC4899' },
] as const;

const statusTypes = [
  { key: 'ready', label: 'Tenue prête', color: '#10B981' },
  { key: 'preparing', label: 'À préparer', color: '#F59E0B' },
  { key: 'generate', label: 'Générer tenue', color: '#EE7518' },
] as const;

const timeFilters = [
  { key: 'all', label: 'Toutes les dates' },
  { key: 'today', label: 'Aujourd\'hui' },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'thisWeek', label: 'Cette semaine' },
  { key: 'nextWeek', label: 'Semaine prochaine' },
  { key: 'thisMonth', label: 'Ce mois' },
];

interface Filters {
  status: string;
  type: string;
  time: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, createEvent, fetchEvents } = useEvents();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    type: 'all',
    time: 'all'
  });

  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '09:00',
    location: '',
    event_type: 'casual',
    icon: '☕',
    status: 'generate'
  });

  // Get current week dates
  const getCurrentWeekDates = (offset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + (offset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates(currentWeekOffset);

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateString);
  };

  // Filter events based on current filters
  const getFilteredEvents = (): Event[] => {
    let filtered = [...events];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.event_type === filters.type);
    }

    // Time filter
    if (filters.time !== 'all') {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      switch (filters.time) {
        case 'today':
          filtered = filtered.filter(event => event.event_date === todayString);
          break;
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          const tomorrowString = tomorrow.toISOString().split('T')[0];
          filtered = filtered.filter(event => event.event_date === tomorrowString);
          break;
        case 'thisWeek':
          const weekStart = getCurrentWeekDates()[0].toISOString().split('T')[0];
          const weekEnd = getCurrentWeekDates()[6].toISOString().split('T')[0];
          filtered = filtered.filter(event => 
            event.event_date >= weekStart && event.event_date <= weekEnd
          );
          break;
        case 'nextWeek':
          const nextWeekStart = getCurrentWeekDates(1)[0].toISOString().split('T')[0];
          const nextWeekEnd = getCurrentWeekDates(1)[6].toISOString().split('T')[0];
          filtered = filtered.filter(event => 
            event.event_date >= nextWeekStart && event.event_date <= nextWeekEnd
          );
          break;
        case 'thisMonth':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
          filtered = filtered.filter(event => 
            event.event_date >= monthStart && event.event_date <= monthEnd
          );
          break;
      }
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
    if (!newEvent.title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'événement');
      return;
    }

    try {
      await createEvent(newEvent);
      setShowAddModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '09:00',
        location: '',
        event_type: 'casual',
        icon: '☕',
        status: 'generate'
      });
      Alert.alert('Succès', 'Événement créé avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    }
  };

  const getEventTypeIcon = (type: EventType) => {
    const eventType = eventTypes.find(t => t.key === type);
    return eventType ? eventType.icon : Coffee;
  };

  const getEventTypeColor = (type: EventType) => {
    const eventType = eventTypes.find(t => t.key === type);
    return eventType ? eventType.color : '#10B981';
  };

  const getStatusColor = (status: EventStatus) => {
    const statusType = statusTypes.find(s => s.key === status);
    return statusType ? statusType.color : '#EE7518';
  };

  const getStatusLabel = (status: EventStatus) => {
    const statusType = statusTypes.find(s => s.key === status);
    return statusType ? statusType.label : 'Générer tenue';
  };

  const formatDate = (date: Date) => {
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
        month: 'short' 
      });
    }
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const getDayNumber = (date: Date) => {
    return date.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.time !== 'all') count++;
    return count;
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      time: 'all'
    });
  };

  const applyFilters = () => {
    setShowFiltersModal(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Vous devez être connecté pour voir vos événements</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📅 Calendrier</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
              onPress={() => setShowFiltersModal(true)}
            >
              <Filter size={20} color={getActiveFiltersCount() > 0 ? '#FFFFFF' : '#EE7518'} />
              {getActiveFiltersCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendrier - Weekly View */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
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
            style={styles.weekScroll}
            contentContainerStyle={styles.weekContainer}
          >
            {weekDates.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              return (
                <View key={index} style={styles.dayCard}>
                  <View style={[styles.dayHeader, isToday(date) && styles.todayHeader]}>
                    <Text style={[styles.dayName, isToday(date) && styles.todayText]}>
                      {getDayName(date)}
                    </Text>
                    <Text style={[styles.dayNumber, isToday(date) && styles.todayText]}>
                      {getDayNumber(date)}
                    </Text>
                  </View>
                  
                  <View style={styles.dayEvents}>
                    {dayEvents.slice(0, 2).map((event, eventIndex) => {
                      const IconComponent = getEventTypeIcon(event.event_type);
                      return (
                        <View key={eventIndex} style={styles.dayEvent}>
                          <View style={[
                            styles.eventIcon,
                            { backgroundColor: getEventTypeColor(event.event_type) }
                          ]}>
                            <IconComponent size={12} color="#FFFFFF" />
                          </View>
                          <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.eventTime}>
                              {event.event_time}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <Text style={styles.moreEvents}>
                        +{dayEvents.length - 2} autres
                      </Text>
                    )}
                    {dayEvents.length === 0 && (
                      <Text style={styles.noEvents}>Aucun événement</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Liste - All Events with Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Liste des événements</Text>
            <Text style={styles.eventCount}>
              {filteredEvents.length} {filteredEvents.length <= 1 ? 'événement' : 'événements'}
            </Text>
          </View>

          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <View style={styles.activeFilters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterChips}>
                  {filters.status !== 'all' && (
                    <View style={styles.filterChip}>
                      <Text style={styles.filterChipText}>
                        {getStatusLabel(filters.status as EventStatus)}
                      </Text>
                    </View>
                  )}
                  {filters.type !== 'all' && (
                    <View style={styles.filterChip}>
                      <Text style={styles.filterChipText}>
                        {eventTypes.find(t => t.key === filters.type)?.label}
                      </Text>
                    </View>
                  )}
                  {filters.time !== 'all' && (
                    <View style={styles.filterChip}>
                      <Text style={styles.filterChipText}>
                        {timeFilters.find(t => t.key === filters.time)?.label}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.resetFilterChip}
                    onPress={resetFilters}
                  >
                    <Text style={styles.resetFilterText}>Réinitialiser</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Events List */}
          <View style={styles.eventsList}>
            {filteredEvents.length === 0 ? (
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
                {events.length === 0 && (
                  <TouchableOpacity
                    style={styles.createEventButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Plus size={20} color="#FFFFFF" />
                    <Text style={styles.createEventButtonText}>Créer un événement</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredEvents.map((event) => {
                const IconComponent = getEventTypeIcon(event.event_type);
                return (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventCardLeft}>
                      <View style={[
                        styles.eventCardIcon,
                        { backgroundColor: getEventTypeColor(event.event_type) }
                      ]}>
                        <IconComponent size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.eventCardInfo}>
                        <Text style={styles.eventCardTitle}>{event.title}</Text>
                        <Text style={styles.eventCardTime}>
                          {formatDate(new Date(event.event_date))} • {event.event_time}
                        </Text>
                        {event.location && (
                          <View style={styles.eventLocation}>
                            <MapPin size={12} color="#8E8E93" />
                            <Text style={styles.eventLocationText}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.eventCardRight}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(event.status) }
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {getStatusLabel(event.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Cette semaine - Swipeable Section at Bottom */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>
            <View style={styles.swipeIndicator}>
              <View style={styles.swipeDot} />
              <View style={styles.swipeDot} />
              <View style={styles.swipeDot} />
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            style={styles.weeklyScroll}
            contentContainerStyle={styles.weeklyContainer}
          >
            {/* Current Week */}
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyTitle}>Semaine actuelle</Text>
              <Text style={styles.weeklySubtitle}>
                {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
              <View style={styles.weeklyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{getEventsForDate(new Date()).length}</Text>
                  <Text style={styles.statLabel}>Aujourd'hui</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {weekDates.reduce((total, date) => total + getEventsForDate(date).length, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Cette semaine</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {events.filter(e => e.status === 'ready').length}
                  </Text>
                  <Text style={styles.statLabel}>Prêts</Text>
                </View>
              </View>
            </View>

            {/* Next Week Preview */}
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyTitle}>Semaine prochaine</Text>
              <Text style={styles.weeklySubtitle}>
                {getCurrentWeekDates(1)[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {getCurrentWeekDates(1)[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
              <View style={styles.weeklyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {getCurrentWeekDates(1).reduce((total, date) => total + getEventsForDate(date).length, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Événements</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {events.filter(e => {
                      const nextWeekStart = getCurrentWeekDates(1)[0].toISOString().split('T')[0];
                      const nextWeekEnd = getCurrentWeekDates(1)[6].toISOString().split('T')[0];
                      return e.event_date >= nextWeekStart && e.event_date <= nextWeekEnd && e.status === 'generate';
                    }).length}
                  </Text>
                  <Text style={styles.statLabel}>À préparer</Text>
                </View>
              </View>
            </View>

            {/* Monthly Overview */}
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyTitle}>Ce mois</Text>
              <Text style={styles.weeklySubtitle}>
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={styles.weeklyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{events.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {events.filter(e => e.event_type === 'formal').length}
                  </Text>
                  <Text style={styles.statLabel}>Formels</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {events.filter(e => e.event_type === 'casual').length}
                  </Text>
                  <Text style={styles.statLabel}>Décontractés</Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
            <Text style={styles.modalTitle}>Nouvel événement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Titre *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nom de l'événement"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description de l'événement"
                value={newEvent.description}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Date and Time */}
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity style={styles.dateTimeInput}>
                  <CalendarIcon size={20} color="#8E8E93" />
                  <Text style={styles.dateTimeText}>
                    {new Date(newEvent.event_date).toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateTimeGroup}>
                <Text style={styles.inputLabel}>Heure</Text>
                <TouchableOpacity style={styles.dateTimeInput}>
                  <Clock size={20} color="#8E8E93" />
                  <Text style={styles.dateTimeText}>{newEvent.event_time}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lieu</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Lieu de l'événement"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
              />
            </View>

            {/* Event Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type d'événement</Text>
              <View style={styles.typeGrid}>
                {eventTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeCard,
                        newEvent.event_type === type.key && styles.typeCardActive
                      ]}
                      onPress={() => setNewEvent(prev => ({ 
                        ...prev, 
                        event_type: type.key,
                        icon: type.key === 'casual' ? '☕' : type.key === 'formal' ? '💼' : type.key === 'sport' ? '🏃' : '🎉'
                      }))}
                    >
                      <View style={[
                        styles.typeIcon,
                        { backgroundColor: newEvent.event_type === type.key ? type.color : '#F8F9FA' }
                      ]}>
                        <IconComponent 
                          size={20} 
                          color={newEvent.event_type === type.key ? '#FFFFFF' : type.color} 
                        />
                      </View>
                      <Text style={[
                        styles.typeLabel,
                        newEvent.event_type === type.key && styles.typeLabelActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Statut</Text>
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
                    Tous les statuts
                  </Text>
                </TouchableOpacity>
                {statusTypes.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[
                      styles.filterOption,
                      filters.status === status.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: status.key }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === status.key && styles.filterOptionTextActive
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
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
                    Tous les types
                  </Text>
                </TouchableOpacity>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.filterOption,
                      filters.type === type.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, type: type.key }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.type === type.key && styles.filterOptionTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Période</Text>
              <View style={styles.filterOptions}>
                {timeFilters.map((time) => (
                  <TouchableOpacity
                    key={time.key}
                    style={[
                      styles.filterOption,
                      filters.time === time.key && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, time: time.key }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.time === time.key && styles.filterOptionTextActive
                    ]}>
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
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
  content: {
    flex: 1,
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
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
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  eventCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Week Navigation
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

  // Weekly View
  weekScroll: {
    marginHorizontal: -24,
  },
  weekContainer: {
    paddingHorizontal: 24,
    gap: 12,
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
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  todayText: {
    color: '#FFFFFF',
  },
  dayEvents: {
    gap: 8,
  },
  dayEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
    color: '#8E8E93',
  },
  moreEvents: {
    fontSize: 10,
    color: '#EE7518',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  noEvents: {
    fontSize: 11,
    color: '#C7C7CC',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Active Filters
  activeFilters: {
    marginBottom: 16,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resetFilterChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  resetFilterText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Events List
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  eventCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  eventCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventCardTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  eventCardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Weekly Section (Swipeable)
  swipeIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  swipeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E2E1',
  },
  weeklyScroll: {
    marginHorizontal: -24,
  },
  weeklyContainer: {
    paddingHorizontal: 24,
  },
  weeklyCard: {
    width: width - 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  weeklySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EE7518',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  createEventButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createEventButtonText: {
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
    paddingTop: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
    gap: 12,
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateTimeGroup: {
    flex: 1,
  },
  dateTimeInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1C1C1E',
  },

  // Type Selection
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 84) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: '#EE7518',
    backgroundColor: '#FEF3E2',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },

  // Filter Modal
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },

  // Modal Buttons
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
  resetButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
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