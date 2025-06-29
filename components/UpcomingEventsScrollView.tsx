import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useEvents } from '@/hooks/useEvents';
import { Event } from '@/types/database';
import { Calendar as CalendarIcon, User, Shirt, Music } from 'lucide-react-native';

const eventTypeIcons: Record<string, any> = {
  casual: Shirt,
  formal: User,
  sport: Shirt,
  party: Music,
};

export default function UpcomingEventsScrollView() {
  const { getUpcomingEvents, loading } = useEvents();
  const events = getUpcomingEvents(10);

  if (loading) {
    return <ActivityIndicator style={{ margin: 16 }} />;
  }

  if (!events.length) {
    return <Text style={{ margin: 16 }}>Aucun événement à venir.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
      {events.map((event: Event) => {
        const Icon = eventTypeIcons[event.event_type] || CalendarIcon;
        return (
          <View key={event.id} style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}> 
              <Icon size={20} color="#EE7518" />
            </View>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.date}>{new Date(event.event_date + 'T' + event.event_time).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
            <Text style={styles.type}>{event.event_type}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  card: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#1C1C1E',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
    color: '#EE7518',
    textTransform: 'capitalize',
  },
});
