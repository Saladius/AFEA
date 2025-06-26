import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Coffee, Briefcase, Dumbbell, Heart, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Event, EventType } from '@/types/database';

const { width } = Dimensions.get('window');

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

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, error, fetchEvents, deleteEvent } = useEvents();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string): string => {
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

  const getWeekDates = (): Date[] => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getEventsForDate = (date: string): Event[] => {
    return events.filter(event => event.event_date === date);
  };

  const getUpcomingEvents = (): Event[] => {
    const today = formatDate(new Date());
    return events
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

  const handleEventPress = (event: Event) => {
    router.push(`/event-details?id=${event.id}`);
  };

  const handleDeleteEvent = (event: Event) => {
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
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'événement.');
            }
          },
        },
      ]
    );
  };

  const weekDates = getWeekDates();
  const upcomingEvents = getUpcomingEvents();

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
          <Text style={styles.title}>📅 Mes événements</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-event')}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekSection}>
          <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateWeek('prev')}
            >
              <ChevronLeft size={20} color="#8E8E93" />
            </TouchableOpacity>
            
            <Text style={styles.weekTitle}>
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateWeek('next')}
            >
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Week Days with Events */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDaysScroll}>
            {weekDates.map((date, index) => {
              const dateString = formatDate(date);
              const dayEvents = getEventsForDate(dateString);
              const isToday = dateString === formatDate(new Date());
              
              return (
                <View key={index} style={styles.dayContainer}>
                  <View style={[
                    styles.dayCard,
                    isToday && styles.todayCard,
                    dayEvents.length > 0 && styles.dayWithEvents
                  ]}>
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
                      <View style={styles.eventIndicators}>
                        {dayEvents.slice(0, 3).map((event, eventIndex) => (
                          <View
                            key={eventIndex}
                            style={[
                              styles.eventDot,
                              { backgroundColor: eventTypeColors[event.event_type] }
                            ]}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </View>
                  
                  {/* Events for this day */}
                  {dayEvents.length > 0 && (
                    <View style={styles.dayEventsContainer}>
                      {dayEvents.map((event) => {
                        const IconComponent = eventTypeIcons[event.event_type];
                        return (
                          <TouchableOpacity
                            key={event.id}
                            style={styles.miniEventCard}
                            onPress={() => handleEventPress(event)}
                          >
                            <View style={[
                              styles.miniEventIcon,
                              { backgroundColor: eventTypeColors[event.event_type] }
                            ]}>
                              <IconComponent size={12} color="#FFFFFF" />
                            </View>
                            <Text style={styles.miniEventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.miniEventTime}>
                              {formatTime(event.event_time)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Upcoming Events List */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Événements à venir</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des événements...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#E5E2E1" />
              <Text style={styles.emptyTitle}>Aucun événement à venir</Text>
              <Text style={styles.emptySubtitle}>
                Ajoutez votre premier événement pour commencer à planifier vos tenues
              </Text>
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={() => router.push('/add-event')}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {upcomingEvents.map((event) => {
                const IconComponent = eventTypeIcons[event.event_type];
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleEventPress(event)}
                  >
                    <View style={styles.eventCardContent}>
                      <View style={[
                        styles.eventIcon,
                        { backgroundColor: eventTypeColors[event.event_type] }
                      ]}>
                        <IconComponent size={20} color="#FFFFFF" />
                      </View>
                      
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View style={styles.eventDetails}>
                          <View style={styles.eventDetailRow}>
                            <Clock size={14} color="#8E8E93" />
                            <Text style={styles.eventDetailText}>
                              {formatDisplayDate(event.event_date)} • {formatTime(event.event_time)}
                            </Text>
                          </View>
                          {event.location && (
                            <View style={styles.eventDetailRow}>
                              <MapPin size={14} color="#8E8E93" />
                              <Text style={styles.eventDetailText}>{event.location}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.eventActions}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: `${statusColors[event.status]}20` }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: statusColors[event.status] }
                          ]}>
                            {statusLabels[event.status]}
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteEvent(event)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Week Section
  weekSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  weekDaysScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dayContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  dayCard: {
    width: 60,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayCard: {
    backgroundColor: '#EE7518',
  },
  dayWithEvents: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dayName: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  todayText: {
    color: '#FFFFFF',
  },
  eventIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreEvents: {
    fontSize: 8,
    color: '#8E8E93',
    fontWeight: '600',
    marginLeft: 2,
  },
  dayEventsContainer: {
    width: 120,
    gap: 4,
  },
  miniEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    alignItems: 'center',
  },
  miniEventIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniEventTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 2,
  },
  miniEventTime: {
    fontSize: 8,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Upcoming Events
  upcomingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  eventActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },

  // Loading and Error States
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  addEventButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});