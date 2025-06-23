declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_CLOUD_FUNCTION_TAG_CLOTHES: string;
      EXPO_PUBLIC_CLOUD_FUNCTION_SUGGEST_OUTFIT: string;
      EXPO_PUBLIC_GOOGLE_VISION_API_KEY?: string;
      EXPO_PUBLIC_OPENAI_API_KEY?: string;
    }
  }
}

export {};