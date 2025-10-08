'use client';

import { useMemo } from 'react';
import { useWeather } from '../hooks/useWeather';
import { WeatherData } from '../types';

interface WeatherDialogProps {
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}


// Convert temperature from Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9/5) + 32);
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
  const { refreshWeather, isLoading, isError, weatherData } = useWeather({
    autoFetch: true,
    refreshInterval: 300000, // 5 minutes
    userLocation,
  });
  

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


  if (isError) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm border border-red-200 rounded-md shadow-sm px-2 py-1.5 ${className}`}>
        <div className="flex items-center space-x-1.5">
          <span className="text-sm">⚠️</span>
          <span className="text-sm text-red-600">Weather unavailable</span>
          <button
            onClick={handleRefresh}
            className="p-0.5 hover:bg-red-100 rounded-full transition-colors"
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
      <div className={`bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md shadow-sm px-2 py-1.5 ${className}`}>
        <div className="flex items-center space-x-1.5">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const { current_weather } = weatherData;
  const tempF = celsiusToFahrenheit(current_weather.temperature);

  return (
    <div className={`bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md shadow-sm px-2 py-1.5 ${className}`}>
      <div className="flex items-center space-x-1.5">
        {/* Weather Icon */}
        <span className={`text-sm ${current_weather.weathercode >= 95 ? 'animate-bounce' : current_weather.weathercode >= 51 && current_weather.weathercode <= 67 ? 'animate-pulse' : ''}`}>{theme.icon}</span>
        
        {/* Temperature */}
        <span className={`text-sm font-bold ${theme.tempAccent} ${(tempF < 10 || tempF > 90) ? 'animate-pulse' : ''}`}>{tempF}°F</span>
        
        {/* Location indicator */}
        {userLocation && (
          <span className="text-xs text-green-500" title="Using your GPS location">📍</span>
        )}
        
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh weather"
        >
          <svg className={`w-3 h-3 text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
