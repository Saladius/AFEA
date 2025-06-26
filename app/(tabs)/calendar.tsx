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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  X,
  Coffee,
  Briefcase,
  Dumbbell,
  Sparkles
} from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { Event, EventType } from '@/types/database';

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
  const { events, loading, createEvent, getEventsForDate } = useEvents();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [weekEvents, setWeekEvents] = useState<{ [key: string]: Event[] }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'casual' as EventType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes = [
    { key: 'casual', label: 'Décontracté', icon: Coffee, color: '#10B981' },
    { key: 'formal', label: 'Formel', icon: Briefcase, color: '#3B82F6' },
    { key: 'sport', label: 'Sport', icon: Dumbbell, color: '#F59E0B' },
    { key: 'party', label: 'Fête', icon: Sparkles, color: '#EC4899' },
  ] as const;

  useEffect(() => {
    generateCalendarDays();
    generateWeekEvents();
  }, [currentDate, events]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.event_date === dateString);
      
      days.push({
        date: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        hasEvents: dayEvents.length > 0,
        events: dayEvents,
      });
    }
    
    setCalendarDays(days);
  };

  const generateWeekEvents = () => {
    const today = new Date();
    const weekEvents: { [key: string]: Event[] } = {};
    
    // Get events for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(event => event.event_date === dateString);
      if (dayEvents.length > 0) {
        weekEvents[dateString] = dayEvents;
      }
    }
    
    setWeekEvents(weekEvents);
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

  const handleDayPress = (dayIndex: number) => {
    const day = calendarDays[dayIndex];
    if (!day.isCurrentMonth) return;
    
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date);
    setSelectedDate(selectedDate);
    
    // Set form date
    setFormData(prev => ({
      ...prev,
      date: selectedDate.toISOString().split('T')[0],
    }));
    
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        title: formData.title,
        description: formData.description || null,
        event_date: formData.date,
        event_time: formData.time,
        location: formData.location || null,
        event_type: formData.type,
        icon: getEventTypeIcon(formData.type),
        status: 'preparing',
      });

      setShowAddModal(false);
      resetForm();
      Alert.alert('Succès', 'Événement créé avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'casual',
    });
    setSelectedDate(null);
  };

  const getEventTypeIcon = (type: EventType): string => {
    const typeMap = {
      casual: '☕',
      formal: '💼',
      sport: '🏃',
      party: '🎉',
    };
    return typeMap[type] || '📅';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ready':
        return { label: 'Tenue prête', color: '#10B981' };
      case 'preparing':
        return { label: 'À préparer', color: '#F59E0B' };
      case 'generate':
        return { label: 'Générer tenue', color: '#EE7518' };
      default:
        return { label: 'À préparer', color: '#F59E0B' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Calendrier</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Navigation */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {dayNames.map((day) => (
              <Text key={day} style={styles.dayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !day.isCurrentMonth && styles.calendarDayInactive,
                  day.isToday && styles.calendarDayToday,
                ]}
                onPress={() => handleDayPress(index)}
                disabled={!day.isCurrentMonth}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth && styles.calendarDayTextInactive,
                    day.isToday && styles.calendarDayTextToday,
                  ]}
                >
                  {day.date}
                </Text>
                {day.hasEvents && (
                  <View style={styles.eventDots}>
                    {day.events.slice(0, 3).map((_, dotIndex) => (
                      <View key={dotIndex} style={styles.eventDot} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Week Events Section */}
        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>
          {Object.keys(weekEvents).length > 0 ? (
            Object.entries(weekEvents).map(([dateString, dayEvents]) => (
              <View key={dateString} style={styles.weekDay}>
                <Text style={styles.weekDayTitle}>{formatDate(dateString)}</Text>
                {dayEvents.map((event) => {
                  const statusConfig = getStatusConfig(event.status);
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.weekEventCard}
                      onPress={() => router.push(`/(tabs)/event-details?id=${event.id}`)}
                    >
                      <View style={styles.weekEventHeader}>
                        <View style={styles.weekEventIcon}>
                          <Text style={styles.weekEventEmoji}>{event.icon}</Text>
                        </View>
                        <View style={styles.weekEventInfo}>
                          <Text style={styles.weekEventTitle}>{event.title}</Text>
                          <Text style={styles.weekEventTime}>
                            {event.event_time} {event.location && `• ${event.location}`}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.weekEventStatus, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.weekEventStatusText}>{statusConfig.label}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyWeek}>
              <Text style={styles.emptyWeekText}>Aucun événement cette semaine</Text>
              <Text style={styles.emptyWeekSubtext}>
                Ajoutez un événement pour commencer à planifier vos tenues
              </Text>
            </View>
          )}
        </View>

        {/* All Upcoming Events */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Tous les événements à venir</Text>
          {events.length > 0 ? (
            events
              .filter(event => new Date(event.event_date) >= new Date())
              .sort((a, b) => {
                const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
                if (dateCompare === 0) {
                  return a.event_time.localeCompare(b.event_time);
                }
                return dateCompare;
              })
              .map((event) => {
                const statusConfig = getStatusConfig(event.status);
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => router.push(`/(tabs)/event-details?id=${event.id}`)}
                  >
                    <View style={styles.eventHeader}>
                      <View style={styles.eventIcon}>
                        <Text style={styles.eventEmoji}>{event.icon}</Text>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View style={styles.eventDetails}>
                          <View style={styles.eventDetailRow}>
                            <CalendarIcon size={14} color="#8E8E93" />
                            <Text style={styles.eventDetailText}>
                              {formatDate(event.event_date)} • {event.event_time}
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
                    </View>
                    <View style={[styles.eventStatus, { backgroundColor: statusConfig.color }]}>
                      <Text style={styles.eventStatusText}>{statusConfig.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
          ) : (
            <View style={styles.emptyEvents}>
              <Text style={styles.emptyEventsText}>Aucun événement planifié</Text>
              <Text style={styles.emptyEventsSubtext}>
                Créez votre premier événement pour commencer
              </Text>
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
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Event Type Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type d'événement</Text>
              <View style={styles.typeGrid}>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeCard,
                      formData.type === type.key && styles.typeCardActive,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type.key }))}
                  >
                    <View style={[
                      styles.typeIcon,
                      { backgroundColor: formData.type === type.key ? type.color : `${type.color}20` }
                    ]}>
                      <type.icon
                        size={20}
                        color={formData.type === type.key ? '#FFFFFF' : type.color}
                      />
                    </View>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Titre *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nom de l'événement"
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description de l'événement"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Date and Time */}
            <View style={styles.formRow}>
              <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Date *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={formData.date}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                />
              </View>
              <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Heure *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="HH:MM"
                  value={formData.time}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Lieu</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Lieu de l'événement"
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Créer</Text>
              )}
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

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
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
  eventDots: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EE7518',
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  weekSection: {
    marginBottom: 32,
  },
  weekDay: {
    marginBottom: 16,
  },
  weekDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  weekEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weekEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekEventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weekEventEmoji: {
    fontSize: 18,
  },
  weekEventInfo: {
    flex: 1,
  },
  weekEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  weekEventTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  weekEventStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weekEventStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyWeek: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyWeekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyWeekSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Upcoming Events
  upcomingSection: {
    marginBottom: 32,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventEmoji: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
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
  },
  eventStatus: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyEvents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Modal
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
  formSection: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formLabel: {
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 72) / 2,
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
    color: '#1C1C1E',
    textAlign: 'center',
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
  submitButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});