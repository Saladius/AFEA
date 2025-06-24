export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clothes: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          type: string;
          color: string | null;
          season: string | null;
          size: string | null;
          material: string | null;
          style: string | null;
          brand: string | null;
          model: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          type: string;
          color?: string | null;
          season?: string | null;
          size?: string | null;
          material?: string | null;
          style?: string | null;
          brand?: string | null;
          model?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          type?: string;
          color?: string | null;
          season?: string | null;
          size?: string | null;
          material?: string | null;
          style?: string | null;
          brand?: string | null;
          model?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      outfit_suggestions: {
        Row: {
          id: string;
          user_id: string;
          clothes_ids: string[];
          suggestion_date: string;
          context: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          clothes_ids: string[];
          suggestion_date: string;
          context?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          clothes_ids?: string[];
          suggestion_date?: string;
          context?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string;
          location: string | null;
          event_type: 'casual' | 'formal' | 'sport' | 'party';
          icon: string;
          status: 'ready' | 'preparing' | 'generate';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time: string;
          location?: string | null;
          event_type: 'casual' | 'formal' | 'sport' | 'party';
          icon: string;
          status?: 'ready' | 'preparing' | 'generate';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string;
          location?: string | null;
          event_type?: 'casual' | 'formal' | 'sport' | 'party';
          icon?: string;
          status?: 'ready' | 'preparing' | 'generate';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type ClothingType = 'top' | 'bottom' | 'shoes' | 'accessories' | 'outerwear' | 'dress' | 'suit';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';
export type Style = 'casual' | 'formal' | 'sport' | 'chic' | 'vintage' | 'streetwear';
export type EventType = 'casual' | 'formal' | 'sport' | 'party';
export type EventStatus = 'ready' | 'preparing' | 'generate';

export interface ClothingItem {
  id: string;
  user_id: string;
  image_url: string;
  type: ClothingType;
  color: string | null;
  season: Season | null;
  size: string | null;
  material: string | null;
  style: Style | null;
  brand: string | null;
  model: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface OutfitSuggestion {
  id: string;
  user_id: string;
  clothes_ids: string[];
  suggestion_date: string;
  context: string | null;
  created_at: string;
  clothes?: ClothingItem[];
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string | null;
  event_type: EventType;
  icon: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}