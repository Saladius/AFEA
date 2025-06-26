import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Type, AlignLeft } from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { EventType } from '@/types/database';

export default function AddEventScreen() {
  const router = useRouter();
  const { createEvent, loading } = useEvents();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('casual');

  const eventTypes = [
    { key: 'casual', label: 'Décontracté', icon: '🍽️', color: '#10B981' },
    { key: 'formal', label: 'Formel', icon: '🎩', color: '#3B82F6' },
    { key: 'sport', label: 'Sport', icon: '🏃', color: '#F59E0B' },
    { key: 'party', label: 'Fête', icon: '🎉', color: '#EC4899' },
  ] as const;

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate || !eventTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createEvent({
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        event_time: eventTime,
        location: location.trim() || null,
        event_type: eventType,
        icon: eventTypes.find(type => type.key === eventType)?.icon || '🍽️',
        status: 'generate',
      });

      Alert.alert(
        'Événement créé !',
        'Votre événement a été ajouté au calendrier.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'événement. Veuillez réessayer.');
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  React.useEffect(() => {
    // Set default date and time
    if (!eventDate) {
      setEventDate(getCurrentDate());
    }
    if (!eventTime) {
      setEventTime(getCurrentTime());
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel événement</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type d'événement</Text>
          <View style={styles.eventTypesGrid}>
            {eventTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.eventTypeCard,
                  eventType === type.key && styles.eventTypeCardActive,
                  eventType === type.key && { borderColor: type.color }
                ]}
                onPress={() => setEventType(type.key)}
              >
                <Text style={styles.eventTypeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.eventTypeLabel,
                  eventType === type.key && styles.eventTypeLabelActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Titre *</Text>
            <View style={styles.inputContainer}>
              <Type size={20} color="#8E8E93" />
              <TextInput
                style={styles.textInput}
                placeholder="Nom de l'événement"
                placeholderTextColor="#C7C7CC"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.inputContainer}>
              <AlignLeft size={20} color="#8E8E93" />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description de l'événement (optionnel)"
                placeholderTextColor="#C7C7CC"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date et heure</Text>
          
          <View style={styles.dateTimeRow}>
            <View style={[styles.inputGroup, styles.dateInput]}>
              <Text style={styles.inputLabel}>Date *</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#8E8E93" />
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C7C7CC"
                  value={eventDate}
                  onChangeText={setEventDate}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.timeInput]}>
              <Text style={styles.inputLabel}>Heure *</Text>
              <View style={styles.inputContainer}>
                <Clock size={20} color="#8E8E93" />
                <TextInput
                  style={styles.textInput}
                  placeholder="HH:MM"
                  placeholderTextColor="#C7C7CC"
                  value={eventTime}
                  onChangeText={setEventTime}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieu</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#8E8E93" />
              <TextInput
                style={styles.textInput}
                placeholder="Lieu de l'événement (optionnel)"
                placeholderTextColor="#C7C7CC"
                value={location}
                onChangeText={setLocation}
                maxLength={200}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Création...' : 'Créer l\'événement'}
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },

  // Event Types
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTypeCardActive: {
    backgroundColor: '#FEF3E2',
  },
  eventTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  eventTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  eventTypeLabelActive: {
    color: '#1C1C1E',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Date and Time Row
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },

  // Footer
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});