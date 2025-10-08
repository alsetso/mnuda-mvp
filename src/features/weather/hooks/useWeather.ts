import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherState } from '../types';
import { WeatherService } from '../services/weatherService';

interface UseWeatherOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
  userLocation?: { latitude: number; longitude: number } | null; // User's GPS location
}

export function useWeather(options: UseWeatherOptions = {}) {
  const { autoFetch = true, refreshInterval = 300000, userLocation } = options; // 5 minutes default
  
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: 'idle' });
  const lastFetchedLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastFetchTime = useRef<number>(0);
  const retryCount = useRef<number>(0);

  // Helper function to check if location has changed significantly
  const hasLocationChangedSignificantly = useCallback((newLocation: { latitude: number; longitude: number } | null) => {
    if (!newLocation || !lastFetchedLocation.current) return true;
    
    const latDiff = Math.abs(newLocation.latitude - lastFetchedLocation.current.latitude);
    const lngDiff = Math.abs(newLocation.longitude - lastFetchedLocation.current.longitude);
    
    // Consider significant change if more than ~100 meters (roughly 0.001 degrees)
    return latDiff > 0.001 || lngDiff > 0.001;
  }, []);

  // Helper function to check if enough time has passed since last fetch
  const shouldFetchBasedOnTime = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    return timeSinceLastFetch > 300000; // 5 minutes
  }, []);

  const fetchWeather = useCallback(async () => {
    setWeatherState({ status: 'loading' });
    
    try {
      let weather, location;
      
      // Prioritize user's GPS location if available
      if (userLocation) {
        const result = await WeatherService.getWeatherForCoordinates(userLocation.latitude, userLocation.longitude);
        weather = result.weather;
        location = result.location;
        // Track the location we fetched for
        lastFetchedLocation.current = { latitude: userLocation.latitude, longitude: userLocation.longitude };
      } else {
        // Fallback to IP-based location
        const result = await WeatherService.getWeatherForUserLocation();
        weather = result.weather;
        location = result.location;
        // Track the location we fetched for
        lastFetchedLocation.current = { latitude: location.latitude, longitude: location.longitude };
      }
      
      // Update fetch time and reset retry count on success
      lastFetchTime.current = Date.now();
      retryCount.current = 0;
      
      setWeatherState({ 
        status: 'success', 
        data: weather, 
        location 
      });
    } catch (error) {
      setWeatherState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to fetch weather' 
      });
    }
  }, [userLocation]);

  const fetchWeatherForCoordinates = useCallback(async (latitude: number, longitude: number) => {
    setWeatherState({ status: 'loading' });
    
    try {
      const { weather, location } = await WeatherService.getWeatherForCoordinates(latitude, longitude);
      
      // Track the location we fetched for
      lastFetchedLocation.current = { latitude, longitude };
      lastFetchTime.current = Date.now();
      retryCount.current = 0;
      
      setWeatherState({ 
        status: 'success', 
        data: weather, 
        location 
      });
    } catch (error) {
      setWeatherState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to fetch weather' 
      });
    }
  }, []);

  const refreshWeather = useCallback(() => {
    if (weatherState.status === 'success') {
      const { location } = weatherState;
      fetchWeatherForCoordinates(location.latitude, location.longitude);
    } else {
      fetchWeather();
    }
  }, [weatherState, fetchWeather, fetchWeatherForCoordinates]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchWeather();
    }
  }, [autoFetch, fetchWeather]);

  // Refetch weather when user location changes significantly
  useEffect(() => {
    if (userLocation && weatherState.status !== 'loading') {
      // Only fetch if location has changed significantly OR enough time has passed
      if (hasLocationChangedSignificantly(userLocation) || shouldFetchBasedOnTime()) {
        fetchWeather();
      }
    }
  }, [userLocation, fetchWeather, weatherState.status, hasLocationChangedSignificantly, shouldFetchBasedOnTime]);

  // Retry reverse geocoding if we have coordinates but no city/state (with retry limit)
  useEffect(() => {
    if (weatherState.status === 'success' && 
        weatherState.location && 
        weatherState.location.latitude && 
        weatherState.location.longitude &&
        (!weatherState.location.city || !weatherState.location.state) &&
        retryCount.current < 3) { // Limit retries to prevent infinite loops
      
      // Increment retry count
      retryCount.current += 1;
      
      // Retry reverse geocoding after a short delay
      const retryTimer = setTimeout(() => {
        console.log(`Retrying reverse geocoding for better location data... (attempt ${retryCount.current}/3)`);
        fetchWeather();
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [weatherState, fetchWeather]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && weatherState.status === 'success') {
      const interval = setInterval(refreshWeather, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshWeather, weatherState.status]);

  return {
    weatherState,
    fetchWeather,
    fetchWeatherForCoordinates,
    refreshWeather,
    isLoading: weatherState.status === 'loading',
    isError: weatherState.status === 'error',
    isSuccess: weatherState.status === 'success',
    weatherData: weatherState.status === 'success' ? weatherState.data : null,
    location: weatherState.status === 'success' ? weatherState.location : null,
    error: weatherState.status === 'error' ? weatherState.error : null,
  };
}
