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
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Filter } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { Event, EventType, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  events: Event[];
}

export default function CalendarScreen() {
  const router = useRouter();
  const { events, loading, error } = useEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EventType | 'all'>('all');

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const eventTypeFilters = [
    { key: 'all', label: 'Tous', color: '#8E8E93' },
    { key: 'casual', label: 'Décontracté', color: '#10B981' },
    { key: 'formal', label: 'Formel', color: '#3B82F6' },
    { key: 'sport', label: 'Sport', color: '#F59E0B' },
    { key: 'party', label: 'Fête', color: '#EC4899' },
  ] as const;

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, events]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonth.getDate() - i;
      const dayEvents = getEventsForDate(new Date(year, month - 1, date));
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: dayEvents.length > 0,
        events: dayEvents,
      });
    }
    
    // Add days from current month
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDay = new Date(year, month, date);
      const dayEvents = getEventsForDate(currentDay);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(currentDay, today),
        hasEvents: dayEvents.length > 0,
        events: dayEvents,
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      const dayEvents = getEventsForDate(new Date(year, month + 1, date));
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: dayEvents.length > 0,
        events: dayEvents,
      });
    }
    
    setCalendarDays(days);
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateString);
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayPress = (day: CalendarDay, dayIndex: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let selectedDay: Date;
    if (dayIndex < 7 && day.date > 15) {
      // Previous month
      selectedDay = new Date(year, month - 1, day.date);
    } else if (dayIndex > 20 && day.date < 15) {
      // Next month
      selectedDay = new Date(year, month + 1, day.date);
    } else {
      // Current month
      selectedDay = new Date(year, month, day.date);
    }
    
    setSelectedDate(selectedDay);
  };

  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Tenue prête',
          backgroundColor: '#10B981',
          textColor: '#FFFFFF'
        };
      case 'preparing':
        return {
          label: 'À préparer',
          backgroundColor: '#F59E0B',
          textColor: '#FFFFFF'
        };
      case 'generate':
        return {
          label: 'Générer tenue',
          backgroundColor: '#EE7518',
          textColor: '#FFFFFF'
        };
      default:
        return {
          label: 'À préparer',
          backgroundColor: '#F59E0B',
          textColor: '#FFFFFF'
        };
    }
  };

  const getEventTypeIcon = (type: EventType) => {
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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getWeekDatesWithEvents = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const dayEvents = getEventsForDate(date);
      
      if (dayEvents.length > 0) {
        weekDates.push({
          date,
          events: dayEvents,
          dayName: weekDays[i],
          dayNumber: date.getDate(),
          isToday: isSameDay(date, today)
        });
      }
    }
    
    return weekDates;
  };

  const getFilteredUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    let filteredEvents = events.filter(event => event.event_date >= today);
    
    if (selectedFilter !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.event_type === selectedFilter);
    }
    
    return filteredEvents
      .sort((a, b) => {
        const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        if (dateCompare === 0) {
          return a.event_time.localeCompare(b.event_time);
        }
        return dateCompare;
      })
      .slice(0, 10);
  };

  const handleEventPress = (event: Event) => {
    router.push(`/(tabs)/event-details?id=${event.id}`);
  };

  const weekDatesWithEvents = getWeekDatesWithEvents();
  const upcomingEvents = getFilteredUpcomingEvents();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du calendrier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Calendrier</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/add-event')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Widget */}
        <View style={styles.calendarSection}>
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
            >
              <ChevronLeft size={20} color="#8E8E93" />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !day.isCurrentMonth && styles.calendarDayInactive,
                  day.isToday && styles.calendarDayToday,
                ]}
                onPress={() => handleDayPress(day, index)}
              >
                <Text style={[
                  styles.calendarDayText,
                  !day.isCurrentMonth && styles.calendarDayTextInactive,
                  day.isToday && styles.calendarDayTextToday,
                ]}>
                  {day.date}
                </Text>
                {day.hasEvents && (
                  <View style={styles.eventDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* This Week's Events */}
        {weekDatesWithEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Cette semaine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekEventsScroll}>
              {weekDatesWithEvents.map((dayData, index) => (
                <View key={index} style={styles.weekEventCard}>
                  <View style={styles.weekEventHeader}>
                    <Text style={[
                      styles.weekEventDay,
                      dayData.isToday && styles.weekEventDayToday
                    ]}>
                      {dayData.dayName}
                    </Text>
                    <Text style={[
                      styles.weekEventDate,
                      dayData.isToday && styles.weekEventDateToday
                    ]}>
                      {dayData.dayNumber}
                    </Text>
                  </View>
                  
                  <View style={styles.weekEventsList}>
                    {dayData.events.slice(0, 2).map((event) => {
                      const statusConfig = getStatusConfig(event.status);
                      return (
                        <TouchableOpacity
                          key={event.id}
                          style={styles.weekEventItem}
                          onPress={() => handleEventPress(event)}
                        >
                          <Text style={styles.weekEventIcon}>
                            {getEventTypeIcon(event.event_type)}
                          </Text>
                          <View style={styles.weekEventInfo}>
                            <Text style={styles.weekEventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.weekEventTime}>
                              {formatTime(event.event_time)}
                            </Text>
                          </View>
                          <View style={[
                            styles.weekEventStatus,
                            { backgroundColor: statusConfig.backgroundColor }
                          ]}>
                            <Text style={styles.weekEventStatusDot}>•</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    {dayData.events.length > 2 && (
                      <Text style={styles.moreEventsText}>
                        +{dayData.events.length - 2} autres
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Event Type Filters */}
        <View style={styles.section}>
          <View style={styles.filtersHeader}>
            <Text style={styles.sectionTitle}>🗓️ Événements à venir</Text>
            <Filter size={20} color="#8E8E93" />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {eventTypeFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.filterChipActive,
                  selectedFilter === filter.key && { backgroundColor: filter.color }
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter.key && styles.filterChipTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming Events List */}
        <View style={styles.section}>
          {upcomingEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {upcomingEvents.map((event) => {
                const statusConfig = getStatusConfig(event.status);
                const eventDate = new Date(event.event_date);
                const isToday = isSameDay(eventDate, new Date());
                const isTomorrow = isSameDay(eventDate, new Date(Date.now() + 24 * 60 * 60 * 1000));
                
                let dateLabel = eventDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                });
                
                if (isToday) dateLabel = "Aujourd'hui";
                else if (isTomorrow) dateLabel = "Demain";

                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleEventPress(event)}
                  >
                    <View style={styles.eventCardHeader}>
                      <View style={styles.eventIconContainer}>
                        <Text style={styles.eventCardIcon}>
                          {getEventTypeIcon(event.event_type)}
                        </Text>
                      </View>
                      
                      <View style={styles.eventCardInfo}>
                        <Text style={styles.eventCardTitle}>{event.title}</Text>
                        <Text style={styles.eventCardDate}>{dateLabel}</Text>
                        
                        <View style={styles.eventCardDetails}>
                          <View style={styles.eventCardDetail}>
                            <Clock size={14} color="#8E8E93" />
                            <Text style={styles.eventCardDetailText}>
                              {formatTime(event.event_time)}
                            </Text>
                          </View>
                          
                          {event.location && (
                            <View style={styles.eventCardDetail}>
                              <MapPin size={14} color="#8E8E93" />
                              <Text style={styles.eventCardDetailText} numberOfLines={1}>
                                {event.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={[
                        styles.eventCardStatus,
                        { backgroundColor: statusConfig.backgroundColor }
                      ]}>
                        <Text style={[
                          styles.eventCardStatusText,
                          { color: statusConfig.textColor }
                        ]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#E5E2E1" />
              <Text style={styles.emptyStateTitle}>Aucun événement à venir</Text>
              <Text style={styles.emptyStateSubtitle}>
                Créez votre premier événement pour commencer à planifier vos tenues
              </Text>
              <TouchableOpacity
                style={styles.createEventButton}
                onPress={() => router.push('/(tabs)/add-event')}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createEventButtonText}>Créer un événement</Text>
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
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
    padding: 24,
  },

  // Calendar Section
  calendarSection: {
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
  monthHeader: {
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
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: '#EE7518',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  calendarDayTextInactive: {
    color: '#C7C7CC',
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EE7518',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Week Events
  weekEventsScroll: {
    flexGrow: 0,
  },
  weekEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weekEventHeader: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  weekEventDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 2,
  },
  weekEventDayToday: {
    color: '#EE7518',
    fontWeight: '600',
  },
  weekEventDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  weekEventDateToday: {
    color: '#EE7518',
  },
  weekEventsList: {
    gap: 8,
  },
  weekEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekEventIcon: {
    fontSize: 16,
  },
  weekEventInfo: {
    flex: 1,
  },
  weekEventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  weekEventTime: {
    fontSize: 10,
    color: '#8E8E93',
  },
  weekEventStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekEventStatusDot: {
    color: '#FFFFFF',
    fontSize: 8,
  },
  moreEventsText: {
    fontSize: 10,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },

  // Filters
  filtersScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Events List
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
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventCardIcon: {
    fontSize: 20,
  },
  eventCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventCardDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  eventCardDetails: {
    gap: 4,
  },
  eventCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventCardDetailText: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  eventCardStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  eventCardStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EE7518',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createEventButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});