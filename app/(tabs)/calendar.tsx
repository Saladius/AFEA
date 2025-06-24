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
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { Event, EventType, EventStatus } from '@/types/database';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  X, 
  Filter,
  ChevronDown,
  Eye,
  Sparkles
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

interface Filters {
  status: EventStatus | 'all';
  type: EventType | 'all';
  timeRange: 'all' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month';
}

const eventTypeIcons: { [key in EventType]: string } = {
  casual: '☕',
  formal: '💼',
  sport: '🏃',
  party: '🎉',
};

const eventTypeLabels: { [key in EventType]: string } = {
  casual: 'Décontracté',
  formal: 'Formel',
  sport: 'Sport',
  party: 'Soirée',
};

const statusLabels: { [key in EventStatus]: string } = {
  ready: 'Tenue prête',
  preparing: 'À préparer',
  generate: 'Générer tenue',
};

const statusColors: { [key in EventStatus]: string } = {
  ready: '#10B981',
  preparing: '#F59E0B',
  generate: '#EE7518',
};

const statusBackgroundColors: { [key in EventStatus]: string } = {
  ready: '#ECFDF5',
  preparing: '#FFFBEB',
  generate: '#FEF3E2',
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const { 
    events, 
    loading, 
    createEvent, 
    updateEventStatus, 
    deleteEvent,
    getEventsForDate,
    getUpcomingEvents 
  } = useEvents();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    type: 'all',
    timeRange: 'all'
  });

  const [formData, setFormData] = useState<CreateEventForm>({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '10:00',
    location: '',
    event_type: 'casual',
    icon: '☕',
  });

  // Get week dates
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

  const weekDates = getWeekDates(currentWeek);

  // Filter events based on current filters
  const getFilteredEvents = () => {
    let filteredEvents = [...events];

    // Filter by status
    if (filters.status !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.status === filters.status);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.event_type === filters.type);
    }

    // Filter by time range
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    switch (filters.timeRange) {
      case 'today':
        filteredEvents = filteredEvents.filter(event => 
          event.event_date === today.toISOString().split('T')[0]
        );
        break;
      case 'tomorrow':
        filteredEvents = filteredEvents.filter(event => 
          event.event_date === tomorrow.toISOString().split('T')[0]
        );
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });
        break;
      case 'next_week':
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() - today.getDay() + 8);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate >= nextWeekStart && eventDate <= nextWeekEnd;
        });
        break;
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate >= startOfMonth && eventDate <= endOfMonth;
        });
        break;
    }

    return filteredEvents.sort((a, b) => {
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
        event_time: '10:00',
        location: '',
        event_type: 'casual',
        icon: '☕',
      });

      setShowCreateModal(false);
      Alert.alert('Succès', 'Événement créé avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    try {
      await updateEventStatus(eventId, newStatus);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
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
        month: 'long' 
      });
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Calendrier</Text>
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
        {/* Weekly View Section */}
        <View style={styles.weeklySection}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekScroll}
            contentContainerStyle={styles.weekContainer}
          >
            {weekDates.map((date, index) => {
              const dateString = date.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(dateString);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <View key={index} style={styles.dayCard}>
                  <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
                    <Text style={[styles.dayName, isToday && styles.todayText]}>
                      {getDayName(date)}
                    </Text>
                    <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  
                  <View style={styles.dayEvents}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <View key={event.id} style={styles.weekEventCard}>
                        <View style={styles.weekEventHeader}>
                          <Text style={styles.weekEventIcon}>{event.icon}</Text>
                          <Text style={styles.weekEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </View>
                        <Text style={styles.weekEventTime}>
                          {formatTime(event.event_time)}
                        </Text>
                      </View>
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

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <View style={styles.activeFiltersSection}>
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersTitle}>Filtres actifs</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activeFiltersContainer}>
              {filters.status !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    Statut: {statusLabels[filters.status]}
                  </Text>
                </View>
              )}
              {filters.type !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    Type: {eventTypeLabels[filters.type]}
                  </Text>
                </View>
              )}
              {filters.timeRange !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    Période: {filters.timeRange === 'today' ? 'Aujourd\'hui' : 
                             filters.timeRange === 'tomorrow' ? 'Demain' :
                             filters.timeRange === 'this_week' ? 'Cette semaine' :
                             filters.timeRange === 'next_week' ? 'Semaine prochaine' :
                             filters.timeRange === 'this_month' ? 'Ce mois' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Events List Section */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.sectionTitle}>
              Tous les événements ({filteredEvents.length})
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des événements...</Text>
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
              {events.length === 0 && (
                <TouchableOpacity
                  style={styles.createFirstEventButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.createFirstEventButtonText}>Créer un événement</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.eventsList}>
              {filteredEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventIconContainer}>
                      <Text style={styles.eventIcon}>{event.icon}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDateTime}>
                        {formatTime(event.event_time)} - {formatTime(event.event_time.split(':').map((part, i) => i === 1 ? String(parseInt(part) + 30).padStart(2, '0') : part).join(':'))}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventFooter}>
                    <View style={[
                      styles.statusTag,
                      { backgroundColor: statusBackgroundColors[event.status] }
                    ]}>
                      <Text style={[
                        styles.statusTagText,
                        { color: statusColors[event.status] }
                      ]}>
                        {statusLabels[event.status]}
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        if (event.status === 'generate') {
                          handleStatusChange(event.id, 'preparing');
                        } else if (event.status === 'preparing') {
                          handleStatusChange(event.id, 'ready');
                        }
                      }}
                    >
                      <View style={styles.actionButtonContent}>
                        {event.status === 'ready' ? (
                          <>
                            <Eye size={16} color="#EE7518" />
                            <Text style={styles.actionButtonText}>Voir tenue</Text>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} color="#EE7518" />
                            <Text style={styles.actionButtonText}>Générer tenue</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="jj/mm/aaaa"
                  value={formData.event_date}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, event_date: text }))}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Heure *</Text>
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
              <Text style={styles.label}>Type d'événement *</Text>
              <View style={styles.typeSelector}>
                {Object.entries(eventTypeLabels).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.typeOption,
                      formData.event_type === key && styles.typeOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      event_type: key as EventType,
                      icon: eventTypeIcons[key as EventType]
                    }))}
                  >
                    <Text style={styles.typeIcon}>{eventTypeIcons[key as EventType]}</Text>
                    <Text style={[
                      styles.typeLabel,
                      formData.event_type === key && styles.typeLabelActive
                    ]}>
                      {label}
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

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Statut</Text>
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
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      status: option.key as EventStatus | 'all' 
                    }))}
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
              <Text style={styles.filterSectionTitle}>Type d'événement</Text>
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
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      type: option.key as EventType | 'all' 
                    }))}
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
              <Text style={styles.filterSectionTitle}>Période</Text>
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
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      timeRange: option.key as any 
                    }))}
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
              style={styles.resetButton}
              onPress={resetFilters}
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
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  weekScroll: {
    paddingLeft: 24,
  },
  weekContainer: {
    paddingRight: 24,
  },
  dayCard: {
    width: 120,
    marginRight: 16,
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
    textTransform: 'uppercase',
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
    gap: 8,
  },
  weekEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EE7518',
  },
  weekEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  weekEventIcon: {
    fontSize: 14,
  },
  weekEventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  weekEventTime: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  moreEventsText: {
    fontSize: 10,
    color: '#EE7518',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 4,
  },
  noEventsText: {
    fontSize: 10,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Active Filters
  activeFiltersSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 8,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  resetFiltersText: {
    fontSize: 14,
    color: '#EE7518',
    fontWeight: '500',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: '#FEF3E2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EE7518',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
  },

  // Events Section
  eventsSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  eventsSectionHeader: {
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
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
    marginBottom: 24,
    lineHeight: 24,
  },
  createFirstEventButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createFirstEventButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsList: {
    gap: 16,
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
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
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
    fontWeight: '500',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EE7518',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#EE7518',
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
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    gap: 8,
  },
  typeOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
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
    color: '#FFFFFF',
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
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
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