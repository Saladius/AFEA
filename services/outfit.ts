import { supabase } from '@/lib/supabase';
import { OutfitSuggestion, ClothingItem } from '@/types/database';
import { apiService } from './api';
import { clothesService } from './clothes';

class OutfitService {
  async getOutfitSuggestions(userId: string): Promise<OutfitSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('outfit_suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching outfit suggestions:', error);
      throw error;
    }
  }

  async saveOutfitSuggestion(suggestion: Omit<OutfitSuggestion, 'id' | 'created_at'>): Promise<OutfitSuggestion> {
    try {
      const { data, error } = await supabase
        .from('outfit_suggestions')
        .insert([suggestion])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving outfit suggestion:', error);
      throw error;
    }
  }

  async generateOutfitSuggestion(
    userId: string,
    context?: string,
    season?: string
  ): Promise<OutfitSuggestion> {
    try {
      // Get user's clothes
      const clothes = await clothesService.getClothes(userId);
      
      if (clothes.length === 0) {
        throw new Error('No clothes found in wardrobe');
      }

      // Prepare data for AI suggestion
      const clothesData = clothes.map(item => ({
        id: item.id,
        type: item.type,
        color: item.color || 'unknown',
        style: item.style || 'casual',
        season: item.season || 'all',
      }));

      // Call AI service
      const aiResponse = await apiService.suggestOutfit({
        clothes: clothesData,
        context,
        season,
      });

      // Create outfit suggestion
      const suggestion: Omit<OutfitSuggestion, 'id' | 'created_at'> = {
        user_id: userId,
        clothes_ids: aiResponse.suggested_clothes_ids,
        suggestion_date: new Date().toISOString().split('T')[0],
        context: context || null,
      };

      // Save and return
      const savedSuggestion = await this.saveOutfitSuggestion(suggestion);
      
      // Attach actual clothes data
      const suggestedClothes = clothes.filter(item => 
        aiResponse.suggested_clothes_ids.includes(item.id)
      );

      return {
        ...savedSuggestion,
        clothes: suggestedClothes,
      };

    } catch (error) {
      console.error('Error generating outfit suggestion:', error);
      throw error;
    }
  }

  async getOutfitWithClothes(suggestion: OutfitSuggestion): Promise<OutfitSuggestion> {
    try {
      const clothes: ClothingItem[] = [];
      
      for (const clothesId of suggestion.clothes_ids) {
        const item = await clothesService.getClothesById(clothesId);
        if (item) {
          clothes.push(item);
        }
      }

      return {
        ...suggestion,
        clothes,
      };
    } catch (error) {
      console.error('Error getting outfit with clothes:', error);
      throw error;
    }
  }
}

export const outfitService = new OutfitService();