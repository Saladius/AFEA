import React, { useState } from 'react';
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
  Platform,
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
  User
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: 'casual' | 'formal' | 'sport' | 'party';
  icon: string;
  status: 'ready' | 'preparing' | 'generate';
  description?: string;
}

const dummyEvents: Event[] = [
  {
    id: '1',
    title: 'Réunion d\'équipe',
    date: '2023-06-20',
    time: '10:00 - 11:30',
    location: 'Bureau',
    type: 'formal',
    icon: 'briefcase',
    status: 'ready',
    description: 'Réunion hebdomadaire avec l\'équipe'
  },
  {
    id: '2',
    title: 'Café avec Marc',
    date: '2023-06-20',
    time: '15:00 - 16:00',
    location: 'Café Central',
    type: 'casual',
    icon: 'utensils',
    status: 'preparing',
    description: 'Rattrapage avec Marc'
  }
];

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

export default function CalendarScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(dummyEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [selectedIcon, setSelectedIcon] = useState('utensils');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState<'casual' | 'formal' | 'sport' | 'party'>('casual');
  const [eventDescription, setEventDescription] = useState('');
  
  // Date and Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const currentMonth = selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const currentYear = selectedDate.getFullYear();
  const currentMonthIndex = selectedDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonthIndex - 1);
    } else {
      newDate.setMonth(currentMonthIndex + 1);
    }
    setSelectedDate(newDate);
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
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
      case 'generate': return 'Générer tenue';
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

  const handleCreateEvent = () => {
    if (!eventTitle) {
      Alert.alert('Erreur', 'Veuillez remplir le nom de l\'événement');
      return;
    }

    const formattedDate = eventDate.toISOString().split('T')[0];
    const formattedTime = formatTime(eventTime);

    const newEvent: Event = {
      id: Date.now().toString(),
      title: eventTitle,
      date: formattedDate,
      time: formattedTime,
      location: eventLocation,
      type: eventType,
      icon: selectedIcon,
      status: 'generate',
      description: eventDescription,
    };

    setEvents(prev => [...prev, newEvent]);
    setShowCreateModal(false);
    resetForm();
    Alert.alert('Succès', 'Événement créé avec succès !');
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
      const dayEvents = getEventsForDate(day);
      const isToday = day === 20; // Highlighting day 20 as shown in design
      
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

  const renderEventsList = () => {
    const todayEvents = events.filter(event => event.date === '2023-06-20');
    
    return (
      <View style={styles.eventsListContainer}>
        <Text style={styles.eventsDateTitle}>20 Juin</Text>
        
        {todayEvents.map((event) => {
          const iconData = eventIcons.find(icon => icon.id === event.icon);
          const IconComponent = iconData?.icon || Utensils;
          
          return (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventIconContainer, { backgroundColor: iconData?.bg }]}>
                <IconComponent size={20} color={iconData?.color} />
              </View>
              
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
              
              <View style={styles.eventActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
                </View>
                
                {event.status === 'generate' && (
                  <TouchableOpacity style={styles.generateButton}>
                    <Shirt size={16} color="#EE7518" />
                    <Text style={styles.generateButtonText}>Générer tenue</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
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
          </>
        )}

        {/* Events List */}
        {renderEventsList()}
      </ScrollView>

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
                      onPress={() => setEventType(type.id as any)}
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
              style={styles.createButton}
              onPress={handleCreateEvent}
            >
              <Text style={styles.createButtonText}>Créer l'événement</Text>
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

  // Events List
  eventsListContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  eventsDateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontWeight: '500',
    color: '#FFFFFF',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  generateButtonText: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
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
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
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