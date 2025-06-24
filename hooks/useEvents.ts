import { useState, useEffect } from 'react';
import { Event, EventType, EventStatus } from '@/types/database';
import { eventsService } from '@/services/events';
import { useAuth } from './useAuth';

export function useEvents() {
  const { user, ensureUserExists } = useAuth();
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
      
      // Ensure user exists before fetching events
      await ensureUserExists(user);
      
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
      console.log('🔍 User ID:', user.id);
      
      // Ensure user exists before creating event
      await ensureUserExists(user);
      
      const newEvent = await eventsService.createEvent({
        ...eventData,
        user_id: user.id,
      });
      console.log('✅ Event created:', newEvent);
      
      // Immediately refresh the events list to ensure live updates
      await fetchEvents();
      
      return newEvent;
    } catch (err) {
      console.error('❌ Error creating event:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to create event';
      if (err instanceof Error) {
        if (err.message.includes('Foreign key constraint')) {
          errorMessage = 'Erreur de compte utilisateur. Veuillez vous reconnecter.';
        } else if (err.message.includes('does not exist in users table')) {
          errorMessage = 'Compte utilisateur non trouvé. Veuillez vous reconnecter.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedEvent = await eventsService.updateEvent(id, updates);
      // Refresh events list to ensure consistency
      await fetchEvents();
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
      // Refresh events list after deletion
      await fetchEvents();
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