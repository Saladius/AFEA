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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Coffee,
  Dumbbell,
  Sparkles
} from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Event, EventType, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');

interface EventFilters {
  type: EventType | 'all';
  status: EventStatus | 'all';
  search: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, createEvent, getEventsForDate, getUpcomingEvents } = useEvents();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    type: 'all',
    status: 'all',
    search: ''
  });

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    event_type: 'casual' as EventType,
    icon: '📅',
  });

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeek(getStartOfWeek(today));
    setNewEvent(prev => ({
      ...prev,
      event_date: today.toISOString().split('T')[0],
      event_time: '09:00'
    }));
  }, []);

  const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    start.setDate(diff);
    return start;
  };

  const getWeekDays = (startDate: Date): Date[] => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getEventsForWeek = (): { [key: string]: Event[] } => {
    const weekDays = getWeekDays(currentWeek);
    const weekEvents: { [key: string]: Event[] } = {};
    
    weekDays.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      weekEvents[dateStr] = getEventsForDate(dateStr);
    });
    
    return weekEvents;
  };

  const getFilteredEvents = (): Event[] => {
    let filteredEvents = getUpcomingEvents(50); // Get more events for filtering
    
    if (filters.type !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.event_type === filters.type);
    }
    
    if (filters.status !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.status === filters.status);
    }
    
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm) ||
        event.location?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredEvents;
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.event_date || !newEvent.event_time) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createEvent({
        title: newEvent.title,
        description: newEvent.description || null,
        event_date: newEvent.event_date,
        event_time: newEvent.event_time,
        location: newEvent.location || null,
        event_type: newEvent.event_type,
        icon: newEvent.icon,
        status: 'preparing',
      });

      setShowAddModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: selectedDate.toISOString().split('T')[0],
        event_time: '09:00',
        location: '',
        event_type: 'casual',
        icon: '📅',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    }
  };

  const getEventTypeIcon = (type: EventType) => {
    switch (type) {
      case 'formal': return Briefcase;
      case 'sport': return Dumbbell;
      case 'party': return Sparkles;
      case 'casual':
      default: return Coffee;
    }
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'formal': return '#3B82F6';
      case 'sport': return '#10B981';
      case 'party': return '#EC4899';
      case 'casual':
      default: return '#EE7518';
    }
  };

  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case 'ready':
        return { label: 'Tenue prête', color: '#10B981', bgColor: '#ECFDF5' };
      case 'preparing':
        return { label: 'À préparer', color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'generate':
        return { label: 'Générer tenue', color: '#EE7518', bgColor: '#FEF3E2' };
      default:
        return { label: 'À préparer', color: '#F59E0B', bgColor: '#FFFBEB' };
    }
  };

  const formatDate = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      isToday: date.toDateString() === new Date().toDateString()
    };
  };

  const weekEvents = getEventsForWeek();
  const filteredEvents = getFilteredEvents();
  const weekDays = getWeekDays(currentWeek);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Calendrier</Text>
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
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={() => navigateWeek('prev')}
          >
            <ChevronLeft size={20} color="#8E8E93" />
          </TouchableOpacity>
          
          <Text style={styles.weekTitle}>
            {currentWeek.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={() => navigateWeek('next')}
          >
            <ChevronRight size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Week View with Events */}
        <View style={styles.weekContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekDays}>
              {weekDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayEvents = weekEvents[dateStr] || [];
                const dateInfo = formatDate(day);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCard,
                      dateInfo.isToday && styles.dayCardToday,
                      dayEvents.length > 0 && styles.dayCardWithEvents
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[
                      styles.dayName,
                      dateInfo.isToday && styles.dayNameToday
                    ]}>
                      {dateInfo.day}
                    </Text>
                    <Text style={[
                      styles.dayNumber,
                      dateInfo.isToday && styles.dayNumberToday
                    ]}>
                      {dateInfo.date}
                    </Text>
                    
                    {/* Event indicators */}
                    {dayEvents.length > 0 && (
                      <View style={styles.eventIndicators}>
                        {dayEvents.slice(0, 3).map((event, eventIndex) => {
                          const statusConfig = getStatusConfig(event.status);
                          return (
                            <View
                              key={eventIndex}
                              style={[
                                styles.eventDot,
                                { backgroundColor: statusConfig.color }
                              ]}
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
                        )}
                      </View>
                    )}
                    
                    {/* Mini event list for days with events */}
                    {dayEvents.length > 0 && (
                      <View style={styles.miniEventsList}>
                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                          <View key={eventIndex} style={styles.miniEvent}>
                            <Text style={styles.miniEventTime}>{event.event_time}</Text>
                            <Text style={styles.miniEventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* All Upcoming Events List */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tous les événements à venir</Text>
            <Text style={styles.eventsCount}>
              {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
            </Text>
          </View>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#E5E2E1" />
              <Text style={styles.emptyTitle}>Aucun événement</Text>
              <Text style={styles.emptySubtitle}>
                {filters.type !== 'all' || filters.status !== 'all' || filters.search.trim() 
                  ? 'Aucun événement ne correspond à vos filtres'
                  : 'Créez votre premier événement pour commencer'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {filteredEvents.map((event) => {
                const statusConfig = getStatusConfig(event.status);
                const EventTypeIcon = getEventTypeIcon(event.event_type);
                const typeColor = getEventTypeColor(event.event_type);
                
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => router.push(`/(tabs)/event-details?id=${event.id}`)}
                  >
                    <View style={styles.eventCardLeft}>
                      <View style={[styles.eventTypeIcon, { backgroundColor: `${typeColor}20` }]}>
                        <EventTypeIcon size={20} color={typeColor} />
                      </View>
                      
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View style={styles.eventMeta}>
                          <View style={styles.eventMetaRow}>
                            <Clock size={14} color="#8E8E93" />
                            <Text style={styles.eventMetaText}>
                              {new Date(event.event_date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })} • {event.event_time}
                            </Text>
                          </View>
                          {event.location && (
                            <View style={styles.eventMetaRow}>
                              <MapPin size={14} color="#8E8E93" />
                              <Text style={styles.eventMetaText}>{event.location}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.eventCardRight}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.bgColor }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: statusConfig.color }
                        ]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
            <Text style={styles.modalTitle}>Nouvel événement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
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
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description de l'événement"
                value={newEvent.description}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={newEvent.event_date}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, event_date: text }))}
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Heure *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newEvent.event_time}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, event_time: text }))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lieu</Text>
              <TextInput
                style={styles.input}
                placeholder="Lieu de l'événement"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type d'événement</Text>
              <View style={styles.typeSelector}>
                {(['casual', 'formal', 'sport', 'party'] as EventType[]).map((type) => {
                  const TypeIcon = getEventTypeIcon(type);
                  const typeColor = getEventTypeColor(type);
                  const isSelected = newEvent.event_type === type;
                  
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        isSelected && { backgroundColor: `${typeColor}20`, borderColor: typeColor }
                      ]}
                      onPress={() => setNewEvent(prev => ({ ...prev, event_type: type }))}
                    >
                      <TypeIcon size={20} color={isSelected ? typeColor : '#8E8E93'} />
                      <Text style={[
                        styles.typeOptionText,
                        isSelected && { color: typeColor }
                      ]}>
                        {type === 'casual' ? 'Décontracté' :
                         type === 'formal' ? 'Formel' :
                         type === 'sport' ? 'Sport' : 'Fête'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateEvent}
            >
              <Text style={styles.createButtonText}>Créer l'événement</Text>
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rechercher</Text>
              <View style={styles.searchContainer}>
                <Search size={20} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un événement..."
                  value={filters.search}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type d'événement</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'all', label: 'Tous les types' },
                  { value: 'casual', label: 'Décontracté' },
                  { value: 'formal', label: 'Formel' },
                  { value: 'sport', label: 'Sport' },
                  { value: 'party', label: 'Fête' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filters.type === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, type: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.type === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Statut de la tenue</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'ready', label: 'Tenue prête' },
                  { value: 'preparing', label: 'À préparer' },
                  { value: 'generate', label: 'Générer tenue' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filters.status === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === option.value && styles.filterOptionTextActive
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
              style={styles.resetButton}
              onPress={() => setFilters({ type: 'all', status: 'all', search: '' })}
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
  weekNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textTransform: 'capitalize',
  },

  // Week Container
  weekContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  dayCard: {
    width: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardToday: {
    backgroundColor: '#FEF3E2',
    borderColor: '#EE7518',
  },
  dayCardWithEvents: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  dayNameToday: {
    color: '#EE7518',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  dayNumberToday: {
    color: '#EE7518',
  },
  eventIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEvents: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  miniEventsList: {
    width: '100%',
    gap: 4,
  },
  miniEvent: {
    alignItems: 'center',
  },
  miniEventTime: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  miniEventTitle: {
    fontSize: 9,
    color: '#1C1C1E',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Events Section
  eventsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    minHeight: 400,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  eventsCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  eventCardRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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

  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
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
    borderWidth: 1,
    borderColor: '#E5E2E1',
    backgroundColor: '#F8F9FA',
    gap: 8,
    minWidth: 120,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Filter Styles
  searchContainer: {
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    backgroundColor: '#F8F9FA',
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
  resetButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});