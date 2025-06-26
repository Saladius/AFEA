declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_CLOUD_FUNCTION_TAG_CLOTHES: string;
      EXPO_PUBLIC_CLOUD_FUNCTION_SUGGEST_OUTFIT: string;
      EXPO_PUBLIC_GOOGLE_VISION_API_KEY?: string;
      EXPO_PUBLIC_OPENAI_API_KEY?: string;
      EXPO_PUBLIC_OPENWEATHER_API_KEY?: string;
      EXPO_PUBLIC_TWILIO_ACCOUNT_SID?: string;
      EXPO_PUBLIC_TWILIO_AUTH_TOKEN?: string;
      EXPO_PUBLIC_TWILIO_VERIFY_SERVICE_SID?: string;
    }
  }
}

export {};