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

interface LocationCoords {
  latitude: number;
  longitude: number;
}

class WeatherService {
  private apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  private isValidApiKey(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_openweather_api_key' && this.apiKey.length > 10);
  }

  async getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to Paris coordinates
        resolve({ latitude: 48.8566, longitude: 2.3522 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to Paris coordinates
          resolve({ latitude: 48.8566, longitude: 2.3522 });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  async getLocationName(coords: LocationCoords): Promise<string> {
    if (!this.isValidApiKey()) {
      console.warn('OpenWeatherMap API key not configured, using fallback location');
      return 'Paris';
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      
      const data = await response.json();
      return data.name || 'Localisation inconnue';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Paris'; // Fallback
    }
  }

  async getCurrentWeather(coords: LocationCoords): Promise<WeatherData['current']> {
    if (!this.isValidApiKey()) {
      console.warn('OpenWeatherMap API key not configured, using fallback weather data');
      return {
        temperature: 22,
        condition: 'Ensoleillé',
        icon: '☀️',
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch current weather');
      }
      
      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        icon: this.getWeatherIcon(data.weather[0].icon),
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      // Fallback data
      return {
        temperature: 22,
        condition: 'Ensoleillé',
        icon: '☀️',
      };
    }
  }

  async getWeatherForecast(coords: LocationCoords): Promise<WeatherData['forecast']> {
    if (!this.isValidApiKey()) {
      console.warn('OpenWeatherMap API key not configured, using fallback forecast data');
      return this.getFallbackForecast();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather forecast');
      }
      
      const data = await response.json();
      
      // Group forecast by day and get daily min/max
      const dailyForecasts = this.processForecastData(data.list);
      
      return dailyForecasts.slice(0, 7); // Return 7 days
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      // Fallback data
      return this.getFallbackForecast();
    }
  }

  private processForecastData(forecastList: any[]): WeatherData['forecast'] {
    const dailyData: { [key: string]: any } = {};
    
    forecastList.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          date: date,
          temps: [],
          conditions: [],
          icons: [],
        };
      }
      
      dailyData[dayKey].temps.push(item.main.temp);
      dailyData[dayKey].conditions.push(item.weather[0].description);
      dailyData[dayKey].icons.push(item.weather[0].icon);
    });
    
    return Object.entries(dailyData).map(([dateKey, data]) => {
      const temps = data.temps;
      const date = data.date;
      
      return {
        day: this.getDayName(date),
        date: date.getDate().toString(),
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: data.conditions[0],
        icon: this.getWeatherIcon(data.icons[0]),
      };
    });
  }

  private getDayName(date: Date): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  }

  private getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    
    return iconMap[iconCode] || '☀️';
  }

  private getFallbackForecast(): WeatherData['forecast'] {
    const today = new Date();
    const forecast = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      forecast.push({
        day: this.getDayName(date),
        date: date.getDate().toString(),
        high: Math.round(20 + Math.random() * 15),
        low: Math.round(10 + Math.random() * 10),
        condition: 'Ensoleillé',
        icon: '☀️',
      });
    }
    
    return forecast;
  }

  async getCompleteWeatherData(userLocation?: string): Promise<WeatherData> {
    try {
      let coords: LocationCoords;
      let locationName: string;

      if (userLocation) {
        // If user has a saved location, use it (you could geocode it)
        locationName = userLocation;
        coords = { latitude: 48.8566, longitude: 2.3522 }; // Default to Paris for now
      } else {
        // Get current location
        coords = await this.getCurrentLocation();
        locationName = await this.getLocationName(coords);
      }

      const [current, forecast] = await Promise.all([
        this.getCurrentWeather(coords),
        this.getWeatherForecast(coords),
      ]);

      return {
        location: locationName,
        current,
        forecast,
      };
    } catch (error) {
      console.error('Error getting complete weather data:', error);
      
      // Return fallback data
      return {
        location: 'Paris',
        current: {
          temperature: 22,
          condition: 'Ensoleillé',
          icon: '☀️',
        },
        forecast: this.getFallbackForecast(),
      };
    }
  }
}

export const weatherService = new WeatherService();