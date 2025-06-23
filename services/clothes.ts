import { supabase } from '@/lib/supabase';
import { ClothingItem, ClothingType, Season, Style } from '@/types/database';

class ClothesService {
  async getClothes(userId: string): Promise<ClothingItem[]> {
    try {
      const { data, error } = await supabase
        .from('clothes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching clothes:', error);
      throw error;
    }
  }

  async getClothesById(id: string): Promise<ClothingItem | null> {
    try {
      const { data, error } = await supabase
        .from('clothes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching clothing item:', error);
      throw error;
    }
  }

  async addClothingItem(item: Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>): Promise<ClothingItem> {
    try {
      const { data, error } = await supabase
        .from('clothes')
        .insert([item])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding clothing item:', error);
      throw error;
    }
  }

  async updateClothingItem(id: string, updates: Partial<ClothingItem>): Promise<ClothingItem> {
    try {
      const { data, error } = await supabase
        .from('clothes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating clothing item:', error);
      throw error;
    }
  }

  async deleteClothingItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clothes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      throw error;
    }
  }

  async filterClothes(
    userId: string,
    filters: {
      type?: ClothingType;
      color?: string;
      season?: Season;
      style?: Style;
      brand?: string;
    }
  ): Promise<ClothingItem[]> {
    try {
      let query = supabase
        .from('clothes')
        .select('*')
        .eq('user_id', userId);

      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.color) {
        query = query.eq('color', filters.color);
      }
      if (filters.season) {
        query = query.eq('season', filters.season);
      }
      if (filters.style) {
        query = query.eq('style', filters.style);
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error filtering clothes:', error);
      throw error;
    }
  }
}

export const clothesService = new ClothesService();