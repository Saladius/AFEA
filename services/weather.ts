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

interface OpenWeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
      deg: number;
    };
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
}

class WeatherService {
  private apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || 'demo';
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  private isValidApiKey(): boolean {
    return !!(this.apiKey && 
              this.apiKey !== 'demo' && 
              this.apiKey !== 'REPLACE_WITH_YOUR_ACTUAL_OPENWEATHER_API_KEY' &&
              this.apiKey.length > 10);
  }

  async getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to Rabat coordinates (Morocco)
        resolve({ latitude: 34.0209, longitude: -6.8416 });
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
          // Fallback to Rabat coordinates
          resolve({ latitude: 34.0209, longitude: -6.8416 });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  private getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️',
      '04d': '☁️', // broken clouds
      '04n': '☁️',
      '09d': '🌧️', // shower rain
      '09n': '🌧️',
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️',
      '13d': '❄️', // snow
      '13n': '❄️',
      '50d': '🌫️', // mist
      '50n': '🌫️',
    };
    
    return iconMap[iconCode] || '☀️';
  }

  private translateCondition(condition: string): string {
    const translations: { [key: string]: string } = {
      'clear sky': 'Ciel dégagé',
      'few clouds': 'Quelques nuages',
      'scattered clouds': 'Nuages épars',
      'broken clouds': 'Nuageux',
      'shower rain': 'Averses',
      'rain': 'Pluie',
      'thunderstorm': 'Orage',
      'snow': 'Neige',
      'mist': 'Brume',
      'fog': 'Brouillard',
      'haze': 'Brume de chaleur',
      'dust': 'Poussière',
      'sand': 'Sable',
      'ash': 'Cendres volcaniques',
      'squall': 'Grain',
      'tornado': 'Tornade',
      'overcast clouds': 'Couvert',
      'light rain': 'Pluie légère',
      'moderate rain': 'Pluie modérée',
      'heavy intensity rain': 'Pluie forte',
      'very heavy rain': 'Pluie très forte',
      'extreme rain': 'Pluie extrême',
      'freezing rain': 'Pluie verglaçante',
      'light intensity shower rain': 'Averses légères',
      'heavy intensity shower rain': 'Averses fortes',
      'ragged shower rain': 'Averses irrégulières',
    };
    
    return translations[condition.toLowerCase()] || condition;
  }

  async getCurrentWeather(coords: LocationCoords): Promise<WeatherData['current']> {
    if (!this.isValidApiKey()) {
      console.warn('OpenWeatherMap API key not configured, using fallback weather data');
      return {
        temperature: 25,
        condition: 'Ensoleillé',
        icon: '☀️',
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: OpenWeatherResponse = await response.json();
      
      console.log('🌤️ Current weather data received:', {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        icon: data.weather[0].icon,
        rawData: data
      });
      
      return {
        temperature: Math.round(data.main.temp),
        condition: this.translateCondition(data.weather[0].description),
        icon: this.getWeatherIcon(data.weather[0].icon),
      };
    } catch (error) {
      console.error('❌ Error fetching current weather:', error);
      // Fallback data for Morocco
      return {
        temperature: 25,
        condition: 'Ensoleillé',
        icon: '☀️',
      };
    }
  }

  async getWeatherForecast(coords: LocationCoords): Promise<WeatherData['forecast']> {
    if (!this.isValidApiKey()) {
      console.warn('OpenWeatherMap API key not configured, using fallback forecast data');
      return this.getRealisticForecast(coords);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: OpenWeatherForecastResponse = await response.json();
      
      console.log('📅 Raw forecast data received from OpenWeatherMap:');
      console.log('Total forecast entries:', data.list.length);
      console.log('First 10 entries:', data.list.slice(0, 10).map(item => ({
        date: item.dt_txt,
        temp: item.main.temp,
        condition: item.weather[0].description,
        icon: item.weather[0].icon
      })));
      
      // Group forecast data by day (OpenWeatherMap returns 5-day forecast with 3-hour intervals)
      const dailyForecasts = this.groupForecastByDay(data.list);
      
      console.log('📊 Processed daily forecasts:');
      dailyForecasts.forEach((day, index) => {
        console.log(`Day ${index + 1}:`, {
          day: day.day,
          date: day.date,
          high: day.high,
          low: day.low,
          condition: day.condition,
          icon: day.icon
        });
      });
      
      return dailyForecasts.slice(0, 7); // Return only 7 days
    } catch (error) {
      console.error('❌ Error fetching weather forecast:', error);
      console.log('🔄 Falling back to realistic forecast data');
      return this.getRealisticForecast(coords);
    }
  }

  private groupForecastByDay(forecastList: OpenWeatherForecastResponse['list']): WeatherData['forecast'] {
    const dailyData: { [key: string]: any } = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: date,
          temps: [],
          conditions: [],
          icons: []
        };
      }
      
      dailyData[dateKey].temps.push(item.main.temp);
      dailyData[dateKey].conditions.push(item.weather[0].description);
      dailyData[dateKey].icons.push(item.weather[0].icon);
    });
    
    return Object.values(dailyData).map((dayData: any) => {
      const temps = dayData.temps;
      const mostCommonCondition = this.getMostCommon(dayData.conditions);
      const mostCommonIcon = this.getMostCommon(dayData.icons);
      
      return {
        day: this.getDayName(dayData.date),
        date: dayData.date.getDate().toString(),
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: this.translateCondition(mostCommonCondition),
        icon: this.getWeatherIcon(mostCommonIcon),
      };
    });
  }

  private getMostCommon(arr: string[]): string {
    const counts: { [key: string]: number } = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  private getRealisticForecast(coords: LocationCoords): WeatherData['forecast'] {
    console.log('🎲 Generating realistic forecast for coordinates:', coords);
    
    const today = new Date();
    const forecast = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const baseTemp = this.getRealisticTemperature(coords);
      const condition = this.getRealisticCondition(coords, true);
      
      const dayForecast = {
        day: this.getDayName(date),
        date: date.getDate().toString(),
        high: Math.round(baseTemp + Math.random() * 5),
        low: Math.round(baseTemp - 5 - Math.random() * 5),
        condition: condition.description,
        icon: condition.icon,
      };
      
      console.log(`📅 Realistic forecast day ${i + 1}:`, dayForecast);
      forecast.push(dayForecast);
    }
    
    return forecast;
  }

  private getRealisticTemperature(coords: LocationCoords): number {
    // Base temperature on location and season
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Morocco climate simulation
    if (coords.latitude > 30 && coords.latitude < 36) {
      // Morocco latitude range
      const seasonalTemp = [
        18, 20, 23, 26, 30, 34, // Jan-Jun
        37, 36, 32, 28, 23, 19  // Jul-Dec
      ];
      
      const baseTemp = seasonalTemp[month];
      const variation = (Math.random() - 0.5) * 6; // ±3°C variation
      return baseTemp + variation;
    }
    
    // Default for other locations
    return 22 + (Math.random() - 0.5) * 10;
  }

  private getRealisticCondition(coords: LocationCoords, isDay: boolean): { description: string; icon: string } {
    const conditions = [
      { description: 'Ensoleillé', icon: isDay ? '☀️' : '🌙', weight: 60 },
      { description: 'Partiellement nuageux', icon: isDay ? '⛅' : '☁️', weight: 25 },
      { description: 'Nuageux', icon: '☁️', weight: 10 },
      { description: 'Légèrement pluvieux', icon: '🌦️', weight: 5 },
    ];
    
    // Weighted random selection
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const condition of conditions) {
      cumulative += condition.weight;
      if (random <= cumulative) {
        return condition;
      }
    }
    
    return conditions[0]; // Fallback to sunny
  }

  private getDayName(date: Date): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  }

  async getLocationName(coords: LocationCoords): Promise<string> {
    if (!this.isValidApiKey()) {
      return 'Rabat'; // Fallback
    }

    try {
      // Use OpenWeatherMap's reverse geocoding
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      
      const data: OpenWeatherResponse = await response.json();
      return data.name || 'Localisation inconnue';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Rabat'; // Fallback
    }
  }

  async getCompleteWeatherData(userLocation?: string): Promise<WeatherData> {
    try {
      let coords: LocationCoords;
      let locationName: string;

      if (userLocation) {
        // If user has a saved location, use it
        locationName = userLocation;
        coords = { latitude: 34.0209, longitude: -6.8416 }; // Default to Rabat
      } else {
        // Get current location
        coords = await this.getCurrentLocation();
        locationName = await this.getLocationName(coords);
      }

      console.log('🌍 Fetching weather data for:', { locationName, coords });

      const [current, forecast] = await Promise.all([
        this.getCurrentWeather(coords),
        this.getWeatherForecast(coords),
      ]);

      const completeWeatherData = {
        location: locationName,
        current,
        forecast,
      };

      console.log('✅ Complete weather data assembled:', {
        location: completeWeatherData.location,
        currentTemp: completeWeatherData.current.temperature,
        forecastDays: completeWeatherData.forecast.length,
        forecastSummary: completeWeatherData.forecast.map(day => ({
          day: day.day,
          high: day.high,
          low: day.low,
          condition: day.condition
        }))
      });

      return completeWeatherData;
    } catch (error) {
      console.error('❌ Error getting complete weather data:', error);
      
      // Return fallback data for Morocco
      const fallbackData = {
        location: 'Rabat',
        current: {
          temperature: 25,
          condition: 'Ensoleillé',
          icon: '☀️',
        },
        forecast: this.getRealisticForecast({ latitude: 34.0209, longitude: -6.8416 }),
      };

      console.log('🔄 Using fallback weather data:', fallbackData);
      return fallbackData;
    }
  }
}

export const weatherService = new WeatherService();