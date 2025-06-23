import { useState, useEffect } from 'react';
import { weatherService } from '@/services/weather';

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    icon: string;
  };
  forecast: Array<{
    day: string;
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }>;
}

export function useWeather(userLocation?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const weatherData = await weatherService.getCompleteWeatherData(userLocation);
      setWeather(weatherData);
    } catch (err) {
      setError('Impossible de récupérer les données météo');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [userLocation]);

  const refreshWeather = () => {
    fetchWeather();
  };

  return {
    weather,
    loading,
    error,
    refreshWeather,
  };
}