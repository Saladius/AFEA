import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useClothes } from '@/hooks/useClothes';
import { ClothingItem, OutfitSuggestion } from '@/types/database';
import { outfitService } from '@/services/outfit';

export type GeneratorMode = 'heuristic' | 'ai';

const STORAGE_KEY = 'outfit_generator_mode';
const CACHE_PREFIX = 'outfit_cache_';
const getTodayKey = () => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${CACHE_PREFIX}${today}`;
};

/**
 * Hook providing outfit generation capability with two modes:
 *  - heuristic (offline, local)
 *  - ai (calls OpenAI backend via outfitService)
 *
 * The chosen mode is persisted in AsyncStorage so it survives app restarts.
 */
export function useOutfitGenerator() {
  const { clothes } = useClothes();

  const [mode, setMode] = useState<GeneratorMode>('heuristic');
  const [outfit, setOutfit] = useState<OutfitSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved mode from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'ai' || saved === 'heuristic') {
          setMode(saved);
        }
      } catch (err) {
        console.warn('[useOutfitGenerator] Failed to load mode', err);
      }
    })();
  }, []);

  // Persist mode whenever it changes
  const switchMode = useCallback(async (newMode: GeneratorMode) => {
    try {
      setMode(newMode);
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    } catch (err) {
      console.error('[useOutfitGenerator] Failed to save mode', err);
    }
  }, []);

  // -------------------- Heuristic generator (V1) -------------------- //
  const pickRandom = <T,>(arr: T[]): T | undefined =>
    arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;

  const heuristicGenerate = (occasion?: string) => {
    if (!clothes || clothes.length === 0) {
      setOutfit(null);
      return;
    }

    // Basic filtering by occasion using tags
    const filtered = occasion
      ? clothes.filter((c) => c.tags?.includes(occasion))
      : clothes;

    const tops = filtered.filter((c) => c.type === 'top');
    const bottoms = filtered.filter((c) => c.type === 'bottom');
    const shoes = filtered.filter((c) => c.type === 'shoes');

    const chosen: ClothingItem[] = [];
    const top = pickRandom(tops);
    const bottom = pickRandom(bottoms);
    const shoe = pickRandom(shoes);
    if (top) chosen.push(top);
    if (bottom) chosen.push(bottom);
    if (shoe) chosen.push(shoe);

    const suggestion: OutfitSuggestion = {
      id: `local-${Date.now()}`,
      user_id: '',
      clothes_ids: chosen.map((c) => c.id),
      suggestion_date: new Date().toISOString().slice(0, 10),
      context: JSON.stringify({ mode: 'heuristic', occasion: occasion ?? null }),
      created_at: new Date().toISOString(),
    };

    setOutfit(suggestion);
  };

  // -------------------- Public API -------------------- //
  const generateOutfit = useCallback(
    async (occasion?: string, ignoreCache: boolean = false) => {
      // 1. Heuristic mode – no cache needed
      if (mode === 'heuristic') {
        heuristicGenerate(occasion);
        return;
      }

      // 2. AI mode – try cache first
      const cacheKey = getTodayKey();
      if (!ignoreCache) {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const cachedOutfit = JSON.parse(cached) as OutfitSuggestion;
            setOutfit(cachedOutfit);
            return;
          }
        } catch (err) {
          console.warn('[useOutfitGenerator] Failed to read cache', err);
        }
      }

      // AI mode -> call backend
      try {
        setLoading(true);
        const aiOutfit = await outfitService.generateOutfitSuggestion('', occasion);
        setOutfit(aiOutfit);
        // Save to cache for the rest of the day
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(aiOutfit));
        } catch (err) {
          console.warn('[useOutfitGenerator] Failed to cache outfit', err);
        }
      } catch (error) {
        console.error('[useOutfitGenerator] AI generation failed', error);
      } finally {
        setLoading(false);
      }
    },
    [mode, clothes]
  );

  return {
    mode,
    switchMode,
    outfit,
    loading,
    generateOutfit,
  } as const;
}
