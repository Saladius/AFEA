interface TagClothesResponse {
  type?: string;
  color?: string;
  tags?: string[];
  confidence?: number;
}

interface SuggestOutfitRequest {
  clothes: Array<{
    id: string;
    type: string;
    color: string;
    style: string;
    season: string;
  }>;
  context?: string;
  season?: string;
  weather?: string;
}

interface SuggestOutfitResponse {
  suggested_clothes_ids: string[];
  reasoning?: string;
  confidence?: number;
}

class ApiService {
  private cloudFunctionTagClothes = process.env.EXPO_PUBLIC_CLOUD_FUNCTION_TAG_CLOTHES;
  private cloudFunctionSuggestOutfit = process.env.EXPO_PUBLIC_CLOUD_FUNCTION_SUGGEST_OUTFIT;

  async tagClothes(imageUrl: string): Promise<TagClothesResponse> {
    try {
      const response = await fetch(this.cloudFunctionTagClothes, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error tagging clothes:', error);
      throw error;
    }
  }

  async suggestOutfit(request: SuggestOutfitRequest): Promise<SuggestOutfitResponse> {
    try {
      const response = await fetch(this.cloudFunctionSuggestOutfit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error suggesting outfit:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();