import { supabase } from '@/lib/supabase';
import { Event, EventType, EventStatus } from '@/types/database';

class EventsService {
  async getEvents(userId: string): Promise<Event[]> {
    try {
      console.log('🔄 Fetching events for user:', userId);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching events:', error);
        throw error;
      }

      console.log('✅ Events fetched:', data?.length || 0, 'events');
      return data || [];
    } catch (error) {
      console.error('❌ Error in getEvents:', error);
      throw error;
    }
  }

  async getEventById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  async getEventsForDate(userId: string, date: string): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_date', date)
        .order('event_time', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events for date:', error);
      throw error;
    }
  }

  async getEventsForMonth(userId: string, year: number, month: number): Promise<Event[]> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events for month:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    try {
      console.log('🔄 Creating event:', event);

      // Validate that user_id is provided
      if (!event.user_id) {
        throw new Error('user_id is required to create an event');
      }

      // Check if user exists in users table before creating event
      console.log('🔍 Verifying user exists in users table:', event.user_id);
      const { data: userExists, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', event.user_id)
        .single();

      if (userCheckError) {
        console.error('❌ User verification failed:', userCheckError);
        if (userCheckError.code === 'PGRST116') {
          throw new Error(`User with ID ${event.user_id} does not exist in users table. Please ensure the user is properly registered.`);
        }
        throw userCheckError;
      }

      console.log('✅ User verified in users table:', userExists.id);

      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating event:', error);
        
        // Provide more specific error messages
        if (error.code === '23503') {
          throw new Error('Foreign key constraint violation: User does not exist in users table');
        }
        
        throw error;
      }

      console.log('✅ Event created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in createEvent:', error);
      throw error;
    }
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    try {
      console.log('🔄 Updating event:', id, updates);

      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating event:', error);
        throw error;
      }

      console.log('✅ Event updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in updateEvent:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      console.log('🔄 Deleting event:', id);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting event:', error);
        throw error;
      }

      console.log('✅ Event deleted:', id);
    } catch (error) {
      console.error('❌ Error in deleteEvent:', error);
      throw error;
    }
  }

  async updateEventStatus(id: string, status: EventStatus): Promise<Event> {
    try {
      return await this.updateEvent(id, { status });
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  }

  async getEventsByType(userId: string, eventType: EventType): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', eventType)
        .order('event_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events by type:', error);
      throw error;
    }
  }

  async getEventsByStatus(userId: string, status: EventStatus): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('event_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events by status:', error);
      throw error;
    }
  }

  async getUpcomingEvents(userId: string, limit: number = 10): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  }
}

export const eventsService = new EventsService();