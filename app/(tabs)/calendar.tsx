import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  List,
  ArrowLeft,
  MapPin,
  Clock,
  Utensils,
  Briefcase,
  Music,
  Heart,
  GraduationCap,
  Plane,
  Shirt,
  User,
  Filter,
  X,
  RotateCcw
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { EventType, EventStatus } from '@/types/database';

const { width } = Dimensions.get('window');

const eventIcons = [
  { id: 'utensils', icon: Utensils, color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'briefcase', icon: Briefcase, color: '#10B981', bg: '#D1FAE5' },
  { id: 'music', icon: Music, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'heart', icon: Heart, color: '#EF4444', bg: '#FEE2E2' },
  { id: 'graduation', icon: GraduationCap, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'plane', icon: Plane, color: '#06B6D4', bg: '#CFFAFE' },
];

const eventTypes = [
  { id: 'casual', label: 'Décontracté', icon: Shirt },
  { id: 'formal', label: 'Formel', icon: User },
  { id: 'sport', label: 'Sport', icon: Shirt },
  { id: 'party', label: 'Soirée', icon: Music },
];

const statusOptions = [
  { id: 'all', label: 'Tous les statuts' },
  { id: 'ready', label: 'Tenue prête' },
  { id: 'preparing', label: 'À préparer' },
  { id: 'generate', label: 'Générer tenue' },
];

const typeOptions = [
  { id: 'all', label: 'Tous les types' },
  { id: 'casual', label: 'Décontracté' },
  { id: 'formal', label: 'Formel' },
  { id: 'sport', label: 'Sport' },
  { id: 'party', label: 'Soirée' },
];

const timeFilters = [
  { id: 'all', label: 'Toutes les dates' },
  { id: 'today', label: 'Aujourd\'hui' },
  { id: 'tomorrow', label: 'Demain' },
  { id: 'this_week', label: 'Cette semaine' },
  { id: 'next_week', label: 'Semaine prochaine' },
  { id: 'this_month', label: 'Ce mois' },
];

interface Filters {
  status: string;
  type: string;
  time: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    events, 
    loading, 
    createEvent, 
    updateEventStatus, 
    getEventsForDate, 
    getEventsForMonth,
    fetchEvents
  } = useEvents();
  
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Form state
  const [selectedIcon, setSelectedIcon] = useState('utensils');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('casual');
  const [eventDescription, setEventDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Date and Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    type: 'all',
    time: 'all'
  });

  const currentMonth = selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const currentYear = selectedDate.getFullYear();
  const currentMonthIndex = selectedDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Get current week dates with events
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = getEventsForDate(dateStr);
      
      weekDates.push({
        date: date,
        dateStr: dateStr,
        dayName: weekDays[i],
        dayNumber: date.getDate(),
        events: dayEvents,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    
    return weekDates;
  };

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.event_type === filters.type);
    }

    // Filter by time
    if (filters.time !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      switch (filters.time) {
        case 'today':
          filtered = filtered.filter(event => event.event_date === todayStr);
          break;
        case 'tomorrow':
          filtered = filtered.filter(event => event.event_date === tomorrowStr);
          break;
        case 'this_week':
          const weekStart = new Date(today);
          const weekEnd = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() + 1);
          weekEnd.setDate(today.getDate() - today.getDay() + 7);
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.event_date);
            return eventDate >= weekStart && eventDate <= weekEnd;
          });
          break;
        case 'next_week':
          const nextWeekStart = new Date(today);
          const nextWeekEnd = new Date(today);
          nextWeekStart.setDate(today.getDate() - today.getDay() + 8);
          nextWeekEnd.setDate(today.getDate() - today.getDay() + 14);
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.event_date);
            return eventDate >= nextWeekStart && eventDate <= nextWeekEnd;
          });
          break;
        case 'this_month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.event_date);
            return eventDate >= monthStart && eventDate <= monthEnd;
          });
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
  }, [events, filters]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonthIndex - 1);
    } else {
      newDate.setMonth(currentMonthIndex + 1);
    }
    setSelectedDate(newDate);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getEventsForDate(dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10B981';
      case 'preparing': return '#F59E0B';
      case 'generate': return '#EE7518';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Tenue prête';
      case 'preparing': return 'À préparer';
      case 'generate': return 'Voir tenue';
      default: return status;
    }
  };

  const resetForm = () => {
    setSelectedIcon('utensils');
    setEventTitle('');
    setEventDate(new Date());
    setEventTime(new Date());
    setEventLocation('');
    setEventType('casual');
    setEventDescription('');
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      time: 'all'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleCreateEvent = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un événement');
      return;
    }

    if (!eventTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom de l\'événement');
      return;
    }

    setIsCreating(true);
    
    try {
      const formattedDate = eventDate.toISOString().split('T')[0];
      const formattedTime = formatTime(eventTime);

      await createEvent({
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        event_date: formattedDate,
        event_time: formattedTime,
        location: eventLocation.trim() || null,
        event_type: eventType,
        icon: selectedIcon,
        status: 'generate',
      });

      setShowCreateModal(false);
      resetForm();
      Alert.alert('Succès', 'Événement créé avec succès !');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de l\'événement');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateOutfit = async (eventId: string) => {
    try {
      await updateEventStatus(eventId, 'preparing');
      Alert.alert('Génération en cours', 'La génération de tenue a été lancée !');
    } catch (error) {
      console.error('Error updating event status:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      const prevMonthDay = new Date(currentYear, currentMonthIndex, 0).getDate() - adjustedFirstDay + i + 1;
      days.push(
        <View key={`prev-${i}`} style={styles.dayCell}>
          <Text style={styles.dayTextInactive}>{prevMonthDay}</Text>
        </View>
      );
    }

    // Days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const today = new Date();
      const isToday = day === today.getDate() && 
                     currentMonthIndex === today.getMonth() && 
                     currentYear === today.getFullYear();
      
      days.push(
        <TouchableOpacity key={day} style={styles.dayCell}>
          <View style={[styles.dayContent, isToday && styles.dayContentToday]}>
            <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
              {day}
            </Text>
          </View>
          {dayEvents.length > 0 && (
            <View style={styles.eventDots}>
              {dayEvents.slice(0, 3).map((_, index) => (
                <View key={index} style={styles.eventDot} />
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Fill remaining cells
    const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (adjustedFirstDay + daysInMonth);
    
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <View key={`next-${i}`} style={styles.dayCell}>
          <Text style={styles.dayTextInactive}>{i}</Text>
        </View>
      );
    }

    return days;
  };

  // Render weekly view with events
  const renderWeeklyView = () => {
    const weekDates = getCurrentWeekDates();
    
    return (
      <View style={styles.weeklyViewContainer}>
        <Text style={styles.weeklyViewTitle}>Cette semaine</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.weeklyScroll}
          contentContainerStyle={styles.weeklyContent}
        >
          {weekDates.map((dayData, index) => (
            <View key={index} style={[
              styles.weeklyDayCard,
              dayData.isToday && styles.weeklyDayCardToday
            ]}>
              <Text style={[
                styles.weeklyDayName,
                dayData.isToday && styles.weeklyDayNameToday
              ]}>
                {dayData.dayName}
              </Text>
              <Text style={[
                styles.weeklyDayNumber,
                dayData.isToday && styles.weeklyDayNumberToday
              ]}>
                {dayData.dayNumber}
              </Text>
              
              {dayData.events.length > 0 ? (
                <View style={styles.weeklyEventsContainer}>
                  {dayData.events.slice(0, 2).map((event, eventIndex) => {
                    const iconData = eventIcons.find(icon => icon.id === event.icon);
                    const IconComponent = iconData?.icon || Utensils;
                    
                    return (
                      <View key={eventIndex} style={styles.weeklyEventItem}>
                        <View style={[
                          styles.weeklyEventIcon,
                          { backgroundColor: iconData?.bg }
                        ]}>
                          <IconComponent size={12} color={iconData?.color} />
                        </View>
                        <Text style={styles.weeklyEventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.weeklyEventTime}>
                          {event.event_time.substring(0, 5)}
                        </Text>
                      </View>
                    );
                  })}
                  {dayData.events.length > 2 && (
                    <Text style={styles.weeklyMoreEvents}>
                      +{dayData.events.length - 2} autres
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.weeklyNoEvents}>
                  <Text style={styles.weeklyNoEventsText}>Aucun événement</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEventsList = () => {
    return (
      <View style={styles.eventsListContainer}>
        {/* Filters Header */}
        <View style={styles.filtersHeader}>
          <Text style={styles.eventsListTitle}>
            Tous les événements ({filteredEvents.length})
          </Text>
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Filter size={20} color="#EE7518" />
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {(filters.status !== 'all' || filters.type !== 'all' || filters.time !== 'all') && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFilters}>
                {filters.status !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {statusOptions.find(s => s.id === filters.status)?.label}
                    </Text>
                  </View>
                )}
                {filters.type !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {typeOptions.find(t => t.id === filters.type)?.label}
                    </Text>
                  </View>
                )}
                {filters.time !== 'all' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {timeFilters.find(t => t.id === filters.time)?.label}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.resetFiltersChip}
                  onPress={resetFilters}
                >
                  <RotateCcw size={14} color="#8E8E93" />
                  <Text style={styles.resetFiltersText}>Réinitialiser</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EE7518" />
            <Text style={styles.loadingText}>Chargement des événements...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyEventsContainer}>
            <Text style={styles.emptyEventsText}>
              {events.length === 0 ? 'Aucun événement créé' : 'Aucun événement ne correspond aux filtres'}
            </Text>
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={16} color="#EE7518" />
              <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredEvents.map((event) => {
            const iconData = eventIcons.find(icon => icon.id === event.icon);
            const IconComponent = iconData?.icon || Utensils;
            
            return (
              <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => router.push(`/event-details?id=${event.id}`)}>
                <View style={[styles.eventIconContainer, { backgroundColor: iconData?.bg }]>
                  <IconComponent size={24} color={iconData?.color} />
                </View>
                
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(event.event_date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })} • {event.event_time.substring(0, 5)}
                  </Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  )}
                </View>
                
                <View style={styles.eventActions}>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: event.status === 'ready' ? '#10B981' : event.status === 'preparing' ? '#F59E0B' : '#E5E2E1' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: event.status === 'generate' ? '#EE7518' : '#FFFFFF' }
                    ]}>
                      {getStatusText(event.status)}
                    </Text>
                  </View>
                  
                  {event.status === 'generate' && (
                    <TouchableOpacity 
                      style={styles.generateButton}
                      onPress={() => handleGenerateOutfit(event.id)}
                    >
                      <Shirt size={16} color="#EE7518" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  // Date Picker Component
  const renderDatePicker = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i - 2);
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const daysInSelectedMonth = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Sélectionner une date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDone}>Terminé</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContent}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>Jour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        eventDate.getDate() === day && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(eventDate);
                        newDate.setDate(day);
                        setEventDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        eventDate.getDate() === day && styles.pickerItemTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>Mois</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        eventDate.getMonth() === index && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(eventDate);
                        newDate.setMonth(index);
                        setEventDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        eventDate.getMonth() === index && styles.pickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>Année</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        eventDate.getFullYear() === year && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(eventDate);
                        newDate.setFullYear(year);
                        setEventDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        eventDate.getFullYear() === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Time Picker Component
  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Sélectionner l'heure</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerDone}>Terminé</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContent}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>Heure</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        eventTime.getHours() === hour && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newTime = new Date(eventTime);
                        newTime.setHours(hour);
                        setEventTime(newTime);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        eventTime.getHours() === hour && styles.pickerItemTextSelected
                      ]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>Minutes</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.filter(m => m % 5 === 0).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        Math.floor(eventTime.getMinutes() / 5) * 5 === minute && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newTime = new Date(eventTime);
                        newTime.setMinutes(minute);
                        setEventTime(newTime);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        Math.floor(eventTime.getMinutes() / 5) * 5 === minute && styles.pickerItemTextSelected
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authText}>Vous devez être connecté pour voir vos événements</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.replace('/auth')}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Événements</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('calendar')}
        >
          <CalendarIcon size={20} color={viewMode === 'calendar' ? '#1C1C1E' : '#8E8E93'} />
          <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
            Calendrier
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <List size={20} color={viewMode === 'list' ? '#1C1C1E' : '#8E8E93'} />
          <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
            Liste
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'calendar' && (
          <>
            {/* Calendar Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => navigateMonth('prev')}>
                <ChevronLeft size={24} color="#1C1C1E" />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>{currentMonth}</Text>
              
              <TouchableOpacity onPress={() => navigateMonth('next')}>
                <ChevronRight size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendar}>
              {/* Week days header */}
              <View style={styles.weekDaysHeader}>
                {weekDays.map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar days */}
              <View style={styles.calendarGrid}>
                {renderCalendarDays()}
              </View>
            </View>

            {/* Weekly View */}
            {renderWeeklyView()}
          </>
        )}

        {/* Events List */}
        {renderEventsList()}
      </ScrollView>

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
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterOption,
                      filters.status === option.id && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.id }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === option.id && styles.filterOptionTextActive
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
                {typeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterOption,
                      filters.type === option.id && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, type: option.id }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.type === option.id && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Période</Text>
              <View style={styles.filterOptions}>
                {timeFilters.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterOption,
                      filters.time === option.id && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, time: option.id }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.time === option.id && styles.filterOptionTextActive
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

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <ArrowLeft size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel événement</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Event Icon Selection */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Icône de l'événement</Text>
              
              {/* Selected Icon Display */}
              <View style={styles.selectedIconContainer}>
                {(() => {
                  const iconData = eventIcons.find(icon => icon.id === selectedIcon);
                  const IconComponent = iconData?.icon || Utensils;
                  return (
                    <View style={[styles.selectedIconDisplay, { backgroundColor: iconData?.bg }]}>
                      <IconComponent size={32} color={iconData?.color} />
                    </View>
                  );
                })()}
              </View>

              {/* Icon Options - Fixed Layout */}
              <View style={styles.iconGrid}>
                {eventIcons.map((iconData) => {
                  const IconComponent = iconData.icon;
                  return (
                    <TouchableOpacity
                      key={iconData.id}
                      style={[
                        styles.iconOption,
                        { backgroundColor: iconData.bg },
                        selectedIcon === iconData.id && styles.iconOptionSelected
                      ]}
                      onPress={() => setSelectedIcon(iconData.id)}
                    >
                      <IconComponent size={24} color={iconData.color} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Event Name */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Nom de l'événement</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Dîner avec Sophie"
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Date and Time - Updated with Pickers */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Date et heure</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[styles.pickerButton, styles.datePickerButton]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <CalendarIcon size={20} color="#8E8E93" style={styles.pickerIcon} />
                  <Text style={styles.pickerButtonText}>
                    {formatDate(eventDate)}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.pickerButton, styles.timePickerButton]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color="#8E8E93" style={styles.pickerIcon} />
                  <Text style={styles.pickerButtonText}>
                    {formatTime(eventTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Lieu</Text>
              <View style={styles.locationInputContainer}>
                <MapPin size={20} color="#8E8E93" style={styles.locationIcon} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Ex: Restaurant Le Petit Paris"
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>

            {/* Event Type */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Type d'événement</Text>
              <View style={styles.eventTypeGrid}>
                {eventTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.eventTypeOption,
                        eventType === type.id && styles.eventTypeOptionSelected
                      ]}
                      onPress={() => setEventType(type.id as EventType)}
                    >
                      <IconComponent 
                        size={24} 
                        color={eventType === type.id ? '#FFFFFF' : '#1C1C1E'} 
                      />
                      <Text style={[
                        styles.eventTypeText,
                        eventType === type.id && styles.eventTypeTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                placeholder="Ajoutez une description pour cet événement..."
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Create Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.createButton, isCreating && styles.createButtonDisabled]}
              onPress={handleCreateEvent}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Créer l'événement</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date and Time Pickers */}
      {renderDatePicker()}
      {renderTimePicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#F8F9FA',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  viewModeTextActive: {
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
  },
  
  // Calendar Styles
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayContent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContentToday: {
    backgroundColor: '#EE7518',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  dayTextToday: {
    color: '#FFFFFF',
  },
  dayTextInactive: {
    fontSize: 14,
    color: '#C7C7CC',
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

  // Weekly View Styles
  weeklyViewContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  weeklyViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  weeklyScroll: {
    flexGrow: 0,
  },
  weeklyContent: {
    gap: 12,
  },
  weeklyDayCard: {
    width: 140,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weeklyDayCardToday: {
    borderColor: '#EE7518',
    backgroundColor: '#FEF3E2',
  },
  weeklyDayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  weeklyDayNameToday: {
    color: '#EE7518',
    fontWeight: '600',
  },
  weeklyDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  weeklyDayNumberToday: {
    color: '#EE7518',
  },
  weeklyEventsContainer: {
    gap: 6,
  },
  weeklyEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyEventIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyEventTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  weeklyEventTime: {
    fontSize: 9,
    color: '#8E8E93',
  },
  weeklyMoreEvents: {
    fontSize: 9,
    color: '#EE7518',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  weeklyNoEvents: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  weeklyNoEventsText: {
    fontSize: 10,
    color: '#C7C7CC',
  },

  // Events List - Updated with filters
  eventsListContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  filtersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  activeFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  activeFilterChip: {
    backgroundColor: '#EE7518',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resetFiltersChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  resetFiltersText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEventsText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEventButtonText: {
    fontSize: 14,
    color: '#EE7518',
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#8E8E93',
  },
  eventActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  generateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3E2',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  
  // Filter Styles
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  
  // Icon Selection - Fixed Layout
  selectedIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedIconDisplay: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  iconOption: {
    width: (width - 80) / 3, // 3 icons per row with proper spacing
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#EE7518',
  },

  // Form Inputs
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  
  // Date and Time Pickers - Updated Styles
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    flex: 2,
  },
  timePickerButton: {
    flex: 1,
  },
  pickerIcon: {
    marginRight: 4,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },

  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Event Type Selection
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventTypeOption: {
    width: (width - 72) / 2,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    gap: 8,
  },
  eventTypeOptionSelected: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  eventTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  eventTypeTextSelected: {
    color: '#FFFFFF',
  },

  // Modal Footer
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
    flexDirection: 'row',
    gap: 12,
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
  createButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Date and Time Picker Modal Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EE7518',
  },
  pickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 12,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: '#EE7518',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    textAlign: 'center',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});