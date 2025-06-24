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
      console.log('✅ Events fetched:', data.length, 'items');
      setEvents(data);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsForDate = async (date: string) => {
    if (!user) return [];

    try {
      console.log('🔄 Fetching events for date:', date);
      const data = await eventsService.getEventsForDate(user.id, date);
      console.log('✅ Events for date fetched:', data.length, 'items');
      return data;
    } catch (err) {
      console.error('❌ Error fetching events for date:', err);
      setError('Failed to fetch events for date');
      return [];
    }
  };

  const fetchEventsForMonth = async (year: number, month: number) => {
    if (!user) return [];

    try {
      console.log('🔄 Fetching events for month:', year, month);
      const data = await eventsService.getEventsForMonth(user.id, year, month);
      console.log('✅ Events for month fetched:', data.length, 'items');
      return data;
    } catch (err) {
      console.error('❌ Error fetching events for month:', err);
      setError('Failed to fetch events for month');
      return [];
    }
  };

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    event_date: string;
    event_time: string;
    location?: string;
    event_type: EventType;
    icon: string;
    status?: EventStatus;
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Creating event:', eventData);
      const newEvent = await eventsService.createEvent({
        user_id: user.id,
        title: eventData.title,
        description: eventData.description || null,
        event_date: eventData.event_date,
        event_time: eventData.event_time,
        location: eventData.location || null,
        event_type: eventData.event_type,
        icon: eventData.icon,
        status: eventData.status || 'generate',
      });
      console.log('✅ Event created:', newEvent);
      
      // Update local state immediately
      setEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.event_date + ' ' + a.event_time).getTime() - 
        new Date(b.event_date + ' ' + b.event_time).getTime()
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
      console.log('🔄 Updating event:', id, updates);
      const updatedEvent = await eventsService.updateEvent(id, updates);
      console.log('✅ Event updated:', updatedEvent);
      
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (err) {
      console.error('❌ Error updating event:', err);
      setError('Failed to update event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Deleting event:', id);
      await eventsService.deleteEvent(id);
      console.log('✅ Event deleted');
      
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('❌ Error deleting event:', err);
      setError('Failed to delete event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEventStatus = async (id: string, status: EventStatus) => {
    try {
      console.log('🔄 Updating event status:', id, status);
      const updatedEvent = await eventsService.updateEventStatus(id, status);
      console.log('✅ Event status updated:', updatedEvent);
      
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (err) {
      console.error('❌ Error updating event status:', err);
      setError('Failed to update event status');
      throw err;
    }
  };

  const getUpcomingEvents = async (limit: number = 10) => {
    if (!user) return [];

    try {
      console.log('🔄 Fetching upcoming events');
      const data = await eventsService.getUpcomingEvents(user.id, limit);
      console.log('✅ Upcoming events fetched:', data.length, 'items');
      return data;
    } catch (err) {
      console.error('❌ Error fetching upcoming events:', err);
      setError('Failed to fetch upcoming events');
      return [];
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchEventsForDate,
    fetchEventsForMonth,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    getUpcomingEvents,
  };
}