'use client';

import { useState, useMemo } from 'react';
import { useWeather } from '../hooks/useWeather';
import { WeatherData } from '../types';

interface WeatherDialogProps {
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

// Weather code to description mapping (WMO Weather interpretation codes)
const getWeatherDescription = (code: number, isDay: number): string => {
  const descriptions: Record<number, string> = {
    0: isDay ? 'Clear sky' : 'Clear night',
    1: isDay ? 'Mainly clear' : 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return descriptions[code] || 'Unknown';
};

// Weather code to icon mapping
const getWeatherIcon = (code: number, isDay: number): string => {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 86) return isDay ? '🌦️' : '🌧️';
  if (code >= 95) return '⛈️';
  return '🌤️';
};

// Convert temperature from Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9/5) + 32);
};

// Convert wind speed from km/h to mph
const kmhToMph = (kmh: number): number => {
  return Math.round(kmh * 0.621371);
};

// Get wind direction as text
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Get dynamic theme based on weather and time
const getWeatherTheme = (weatherData: WeatherData) => {
  const { current_weather } = weatherData;
  const isDay = current_weather.is_day === 1;
  const temp = current_weather.temperature;
  const weatherCode = current_weather.weathercode;
  
  // Time-based themes
  const timeTheme = isDay ? {
    bg: 'from-yellow-50 to-orange-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    accent: 'text-orange-600'
  } : {
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'text-indigo-600'
  };

  // Weather-based themes
  let weatherTheme = {
    bg: '',
    border: '',
    text: '',
    accent: '',
    icon: ''
  };

  if (weatherCode === 0) {
    // Clear sky
    weatherTheme = isDay ? {
      bg: 'from-yellow-100 to-orange-100',
      border: 'border-yellow-300',
      text: 'text-yellow-900',
      accent: 'text-orange-600',
      icon: '☀️'
    } : {
      bg: 'from-indigo-100 to-purple-100',
      border: 'border-indigo-300',
      text: 'text-indigo-900',
      accent: 'text-purple-600',
      icon: '🌙'
    };
  } else if (weatherCode >= 1 && weatherCode <= 3) {
    // Cloudy
    weatherTheme = {
      bg: 'from-gray-100 to-slate-100',
      border: 'border-gray-300',
      text: 'text-gray-900',
      accent: 'text-slate-600',
      icon: isDay ? '⛅' : '☁️'
    };
  } else if (weatherCode >= 45 && weatherCode <= 48) {
    // Fog
    weatherTheme = {
      bg: 'from-gray-200 to-gray-300',
      border: 'border-gray-400',
      text: 'text-gray-800',
      accent: 'text-gray-600',
      icon: '🌫️'
    };
  } else if (weatherCode >= 51 && weatherCode <= 67) {
    // Rain
    weatherTheme = {
      bg: 'from-blue-200 to-cyan-200',
      border: 'border-blue-400',
      text: 'text-blue-900',
      accent: 'text-cyan-700',
      icon: '🌧️'
    };
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    // Snow
    weatherTheme = {
      bg: 'from-blue-100 to-cyan-100',
      border: 'border-blue-300',
      text: 'text-blue-900',
      accent: 'text-cyan-700',
      icon: '❄️'
    };
  } else if (weatherCode >= 80 && weatherCode <= 86) {
    // Showers
    weatherTheme = {
      bg: 'from-cyan-200 to-blue-200',
      border: 'border-cyan-400',
      text: 'text-cyan-900',
      accent: 'text-blue-700',
      icon: isDay ? '🌦️' : '🌧️'
    };
  } else if (weatherCode >= 95) {
    // Thunderstorm
    weatherTheme = {
      bg: 'from-purple-200 to-indigo-200',
      border: 'border-purple-400',
      text: 'text-purple-900',
      accent: 'text-indigo-700',
      icon: '⛈️'
    };
  } else {
    // Default
    weatherTheme = {
      ...timeTheme,
      icon: isDay ? '☀️' : '🌙'
    };
  }

  // Temperature-based accent colors
  let tempAccent = '';
  if (temp < 0) {
    tempAccent = 'text-blue-600'; // Freezing
  } else if (temp < 10) {
    tempAccent = 'text-cyan-600'; // Cold
  } else if (temp < 20) {
    tempAccent = 'text-green-600'; // Cool
  } else if (temp < 30) {
    tempAccent = 'text-yellow-600'; // Warm
  } else {
    tempAccent = 'text-red-600'; // Hot
  }

  return {
    ...weatherTheme,
    tempAccent,
    isDay,
    weatherCode
  };
};

export function WeatherDialog({ className = '', userLocation }: WeatherDialogProps) {
  const { weatherState, refreshWeather, isLoading, isError, weatherData, location } = useWeather({
    autoFetch: true,
    refreshInterval: 300000, // 5 minutes
    userLocation,
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Get default theme for weather display
  const theme = useMemo(() => {
    if (!weatherData) {
      return {
        bg: 'from-gray-50 to-gray-100',
        border: 'border-gray-200',
        text: 'text-gray-900',
        accent: 'text-blue-600',
        tempAccent: 'text-black',
        icon: '🌤️'
      };
    }
    
    // Use default theme for weather display
    const weatherTheme = getWeatherTheme(weatherData);
    return {
      ...weatherTheme,
      bg: 'from-gray-50 to-gray-100',
      border: 'border-gray-200',
      text: 'text-gray-900',
      accent: 'text-blue-600',
      tempAccent: 'text-black', // Always use black for temperature
    };
  }, [weatherData]);

  const handleRefresh = () => {
    refreshWeather();
  };

  const formatLocation = (): string => {
    if (!location) return 'Minneapolis, MN';
    
    // Try to get city and state first
    const parts = [location.city, location.state].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // If we have coordinates but no city/state, try to show a more user-friendly format
    if (location.latitude && location.longitude) {
      // Check if we're using GPS location
      if (userLocation) {
        // Show coordinates with a note that we're getting location details
        return `Getting location... (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})`;
      } else {
        // For non-GPS locations, just show coordinates
        return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
      }
    }
    
    // Final fallback
    return 'Minneapolis, MN';
  };

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'Unknown';
    }
  };

  if (isError) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-orange-50 backdrop-blur-sm border border-red-200 rounded-lg shadow-lg p-2 max-w-xs ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="text-xs font-medium text-red-900">Weather Unavailable</div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-red-100 rounded-full transition-colors"
            title="Retry"
          >
            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !weatherData) {
    return (
      <div className={`bg-gradient-to-br ${theme.bg} backdrop-blur-sm border ${theme.border} rounded-lg shadow-lg p-2 max-w-xs ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          <div className="text-xs text-gray-600">
            {userLocation ? 'Getting weather for your location...' : 'Getting weather for Minneapolis...'}
          </div>
        </div>
      </div>
    );
  }

  const { current_weather } = weatherData;
  const tempF = celsiusToFahrenheit(current_weather.temperature);
  const windMph = kmhToMph(current_weather.windspeed);
  const windDir = getWindDirection(current_weather.winddirection);
  const weatherDesc = getWeatherDescription(current_weather.weathercode, current_weather.is_day);

  return (
    <div className={`bg-gradient-to-br ${theme.bg} backdrop-blur-sm border ${theme.border} rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Compact View */}
      <div 
        className="p-2 cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-lg ${current_weather.weathercode >= 95 ? 'animate-bounce' : current_weather.weathercode >= 51 && current_weather.weathercode <= 67 ? 'animate-pulse' : ''}`}>{theme.icon}</span>
            <div>
              <div className={`text-sm font-bold ${theme.tempAccent} ${(tempF < 10 || tempF > 90) ? 'animate-pulse' : ''}`}>{tempF}°F</div>
              <div className={`text-xs ${theme.text} opacity-70 flex items-center space-x-1`}>
                <span>{formatLocation()}</span>
                {userLocation && (
                  <span className="text-green-500" title="Using your GPS location">📍</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              className="p-1 hover:bg-white/30 rounded-full transition-colors"
              title="Refresh weather"
            >
              <svg className={`w-3 h-3 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <svg 
              className={`w-3 h-3 ${theme.text} opacity-60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t border-white/20">
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className={`text-xs ${theme.text} opacity-70`}>Condition</span>
              <span className={`text-xs font-medium ${theme.text}`}>{weatherDesc}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${theme.text} opacity-70`}>Wind</span>
              <span className={`text-xs font-medium ${theme.text}`}>{windMph} mph {windDir}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${theme.text} opacity-70`}>Updated</span>
              <span className={`text-xs font-medium ${theme.text}`}>{formatTime(current_weather.time)}</span>
            </div>
            {location && (
              <div className="flex justify-between items-center">
                <span className={`text-xs ${theme.text} opacity-70`}>Location</span>
                <span className={`text-xs font-medium ${theme.text}`}>
                  {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
