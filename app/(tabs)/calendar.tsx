import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus,
  Briefcase,
  Coffee,
  Dumbbell,
  Heart,
  Star
} from 'lucide-react-native';
import { useEvents } from '@/hooks/useEvents';
import { Event } from '@/types/database';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const router = useRouter();
  const { events, loading, error, fetchEvents } = useEvents();
  const [refreshing, setRefreshing] = useState(false);

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

  const handleEventPress = (event: Event) => {
    router.push(`/(tabs)/event-details?id=${event.id}`);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'formal':
        return Briefcase;
      case 'sport':
        return Dumbbell;
      case 'party':
        return Star;
      case 'casual':
      default:
        return Coffee;
    }
  };

  const getEventIconColor = (eventType: string) => {
    switch (eventType) {
      case 'formal':
        return '#3B82F6';
      case 'sport':
        return '#10B981';
      case 'party':
        return '#EF4444';
      case 'casual':
      default:
        return '#8E8E93';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Prêt',
          backgroundColor: '#10B981',
          textColor: '#FFFFFF'
        };
      case 'preparing':
        return {
          label: 'À préparer',
          backgroundColor: '#EE7518',
          textColor: '#FFFFFF'
        };
      case 'generate':
        return {
          label: 'Générer tenue',
          backgroundColor: '#8B5CF6',
          textColor: '#FFFFFF'
        };
      default:
        return {
          label: 'À préparer',
          backgroundColor: '#EE7518',
          textColor: '#FFFFFF'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  };

  const groupEventsByDate = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const dateKey = event.event_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.event_time.localeCompare(b.event_time));
    });

    return grouped;
  };

  const renderEventCard = (event: Event) => {
    const IconComponent = getEventIcon(event.event_type);
    const iconColor = getEventIconColor(event.event_type);
    const statusConfig = getStatusConfig(event.status);

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.7}
      >
        <View style={styles.eventContent}>
          <View style={[styles.eventIcon, { backgroundColor: `${iconColor}20` }]}>
            <IconComponent size={24} color={iconColor} />
          </View>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDateTime}>
              <Text style={styles.eventDate}>
                {formatDate(event.event_date)} • {event.event_time}
              </Text>
            </View>
            
            <Text style={styles.eventTitle}>{event.title}</Text>
            
            {event.location && (
              <View style={styles.eventLocationContainer}>
                <MapPin size={14} color="#8E8E93" />
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📅 Calendrier</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EE7518" />
          <Text style={styles.loadingText}>Chargement des événements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📅 Calendrier</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort();

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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {events.length} événement{events.length > 1 ? 's' : ''} programmé{events.length > 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EE7518']}
            tintColor="#EE7518"
          />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CalendarIcon size={48} color="#E5E2E1" />
            </View>
            <Text style={styles.emptyTitle}>Aucun événement programmé</Text>
            <Text style={styles.emptySubtitle}>
              Commencez à planifier vos événements et préparez vos tenues à l'avance
            </Text>
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={() => router.push('/(tabs)/add-event')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {sortedDates.map(date => (
              <View key={date} style={styles.dateSection}>
                <View style={styles.dateSectionHeader}>
                  <Text style={styles.dateSectionTitle}>
                    {formatDate(date)}
                  </Text>
                  <Text style={styles.dateSectionCount}>
                    {groupedEvents[date].length} événement{groupedEvents[date].length > 1 ? 's' : ''}
                  </Text>
                </View>
                
                <View style={styles.eventsContainer}>
                  {groupedEvents[date].map(event => renderEventCard(event))}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats
  statsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  statsText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },

  content: {
    flex: 1,
  },

  // Date Sections
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  dateSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dateSectionCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  eventsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },

  // Event Cards
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDetails: {
    flex: 1,
  },
  eventDateTime: {
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#8E8E93',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
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
  bottomPadding: {
    height: 100,
  },
});