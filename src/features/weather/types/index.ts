export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather_units: {
    time: string;
    interval: string;
    temperature: string;
    windspeed: string;
    winddirection: string;
    is_day: string;
    weathercode: string;
  };
  current_weather: {
    time: string;
    interval: number;
    temperature: number;
    windspeed: number;
    winddirection: number;
    is_day: number;
    weathercode: number;
  };
}

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface WeatherError {
  error: boolean;
  reason: string;
}

export type WeatherState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: WeatherData; location: WeatherLocation }
  | { status: 'error'; error: string };
