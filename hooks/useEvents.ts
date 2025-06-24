import { useState, useEffect } from 'react';
import { Event, EventType, EventStatus } from '@/types/database';
import { eventsService } from '@/services/events';
import { useAuth } from './useAuth';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching events for user:', user.id);
      const data = await eventsService.getEvents(user.id);
      console.log('✅ Events fetched:', data.length, 'events');
      setEvents(data);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Creating event:', eventData);
      const newEvent = await eventsService.createEvent({
        ...eventData,
        user_id: user.id,
      });
      console.log('✅ Event created:', newEvent);
      
      // Update local state immediately
      setEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ));
      return newEvent;
    } catch (err) {
      console.error('❌ Error creating event:', err);
      setError('Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedEvent = await eventsService.updateEvent(id, updates);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (err) {
      setError('Failed to update event');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await eventsService.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError('Failed to delete event');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: string): Event[] => {
    return events.filter(event => event.event_date === date);
  };

  const getEventsForMonth = (year: number, month: number): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1;
    });
  };

  const updateEventStatus = async (id: string, status: EventStatus) => {
    return await updateEvent(id, { status });
  };

  const getEventsByType = (eventType: EventType): Event[] => {
    return events.filter(event => event.event_type === eventType);
  };

  const getEventsByStatus = (status: EventStatus): Event[] => {
    return events.filter(event => event.status === status);
  };

  const getUpcomingEvents = (limit: number = 10): Event[] => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.event_date >= today)
      .sort((a, b) => {
        const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        if (dateCompare === 0) {
          return a.event_time.localeCompare(b.event_time);
        }
        return dateCompare;
      })
      .slice(0, limit);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    updateEventStatus,
    getEventsByType,
    getEventsByStatus,
    getUpcomingEvents,
  };
}