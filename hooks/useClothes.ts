import { useState, useEffect } from 'react';
import { ClothingItem, ClothingType, Season, Style } from '@/types/database';
import { clothesService } from '@/services/clothes';
import { useAuth } from './useAuth';

export function useClothes() {
  const { user } = useAuth();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClothes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await clothesService.getClothes(user.id);
      setClothes(data);
    } catch (err) {
      setError('Failed to fetch clothes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addClothingItem = async (item: Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const newItem = await clothesService.addClothingItem(item);
      setClothes(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      setError('Failed to add clothing item');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClothingItem = async (id: string, updates: Partial<ClothingItem>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedItem = await clothesService.updateClothingItem(id, updates);
      setClothes(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      setError('Failed to update clothing item');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClothingItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await clothesService.deleteClothingItem(id);
      setClothes(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete clothing item');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const filterClothes = async (filters: {
    type?: ClothingType;
    color?: string;
    season?: Season;
    style?: Style;
    brand?: string;
  }) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await clothesService.filterClothes(user.id, filters);
      setClothes(data);
    } catch (err) {
      setError('Failed to filter clothes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, [user]);

  return {
    clothes,
    loading,
    error,
    fetchClothes,
    addClothingItem,
    updateClothingItem,
    deleteClothingItem,
    filterClothes,
  };
}