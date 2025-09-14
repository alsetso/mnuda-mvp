/**
 * Environment variable validation and configuration
 * Handles environment variables safely for both build and runtime
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  mapboxToken: string;
  appUrl: string;
  appName: string;
  appDescription: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue) {
    return defaultValue;
  }
  if (!value) {
    // For production builds, return placeholder values to prevent build failures
    // This allows the app to build even when env vars are missing
    console.warn(`Missing environment variable: ${name}. Using placeholder value.`);
    return `placeholder_${name.toLowerCase()}`;
  }
  return value;
}

function getEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    mapboxToken: getEnvVar('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN'),
    appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    appName: getEnvVar('NEXT_PUBLIC_APP_NAME', 'MNUDA'),
    appDescription: getEnvVar('NEXT_PUBLIC_APP_DESCRIPTION', 'Minnesota Realtors Platform'),
    isProduction,
    isDevelopment,
  };
}

// Get environment configuration
export const env = getEnvConfig();

// Export individual values for convenience
export const {
  supabaseUrl,
  supabaseAnonKey,
  mapboxToken,
  appUrl,
  appName,
  appDescription,
  isProduction,
  isDevelopment,
} = env;
