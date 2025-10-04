import { WeatherData, WeatherLocation, WeatherError } from '../types';
import { MAP_CONFIG } from '../../map/config';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

export class WeatherService {
  /**
   * Get user's location based on IP address
   * This provides a good approximation for weather without requiring GPS permissions
   */
  static async getUserLocationByIP(): Promise<WeatherLocation> {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        // timeout: 5000, // 5 second timeout - not supported in fetch API
      });
      
      if (!response.ok) {
        throw new Error(`IP location service error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate the response data
      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid location data received');
      }
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || 'Minneapolis',
        state: data.region || 'Minnesota',
        country: data.country_name || 'United States',
      };
    } catch (error) {
      console.warn('Error fetching location by IP, using Minneapolis fallback:', error);
      // Fallback to Minnesota coordinates (Minneapolis, MN)
      return {
        latitude: 44.9778,
        longitude: -93.2650,
        city: 'Minneapolis',
        state: 'Minnesota',
        country: 'United States',
      };
    }
  }

  /**
   * Get current weather data for given coordinates
   */
  static async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      // Validate coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Invalid coordinates provided');
      }

      const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
      
      const response = await fetch(url, {
        // timeout: 10000, // 10 second timeout - not supported in fetch API
      });
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.current_weather) {
        throw new Error('Invalid weather data received from API');
      }
      
      // Validate required weather data
      const { current_weather } = data;
      if (typeof current_weather.temperature !== 'number' || 
          typeof current_weather.weathercode !== 'number') {
        throw new Error('Incomplete weather data received');
      }
      
      return data as WeatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error(`Failed to fetch weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get weather data for user's location (IP-based)
   */
  static async getWeatherForUserLocation(): Promise<{ weather: WeatherData; location: WeatherLocation }> {
    try {
      const location = await this.getUserLocationByIP();
      const weather = await this.getCurrentWeather(location.latitude, location.longitude);
      
      return { weather, location };
    } catch (error) {
      console.error('Error getting weather for user location:', error);
      throw error;
    }
  }

  /**
   * Get weather data for specific coordinates with reverse geocoding
   */
  static async getWeatherForCoordinates(latitude: number, longitude: number): Promise<{ weather: WeatherData; location: WeatherLocation }> {
    try {
      const weather = await this.getCurrentWeather(latitude, longitude);
      
      // Try to get location details via reverse geocoding
      let location: WeatherLocation = {
        latitude,
        longitude,
      };

      try {
        const locationDetails = await this.reverseGeocode(latitude, longitude);
        location = {
          ...location,
          ...locationDetails,
        };
      } catch (reverseGeocodeError) {
        console.warn('Reverse geocoding failed, using coordinates only:', reverseGeocodeError);
        // Keep the basic location with just coordinates
      }
      
      return { weather, location };
    } catch (error) {
      console.error('Error getting weather for coordinates:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get location details using Mapbox
   */
  private static async reverseGeocode(latitude: number, longitude: number): Promise<Partial<WeatherLocation>> {
    try {
      console.log('Reverse geocoding coordinates:', latitude, longitude);
      
      const token = MAP_CONFIG.MAPBOX_TOKEN;
      if (!token || token === 'your_mapbox_token_here') {
        console.warn('No Mapbox token available for reverse geocoding');
        throw new Error('No geocoding service available');
      }

      const response = await fetch(
        `${MAP_CONFIG.GEOCODING_BASE_URL}/${longitude},${latitude}.json?access_token=${token}&types=place,locality,neighborhood`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Mapbox reverse geocoding response:', data);
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const addressComponents = feature.context || [];
        
        // Extract address components
        const city = feature.text || '';
        const state = addressComponents.find((c: Record<string, unknown>) => (c.id as string).startsWith('region'))?.text || '';
        const country = addressComponents.find((c: Record<string, unknown>) => (c.id as string).startsWith('country'))?.text || '';
        
        console.log('Successfully reverse geocoded:', { city, state, country });
        return {
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          country: country.trim() || undefined,
        };
      }
      
      throw new Error('No location data found');
    } catch (error) {
      console.warn('Reverse geocoding error:', error);
      throw error;
    }
  }
}

export const weatherService = new WeatherService();
