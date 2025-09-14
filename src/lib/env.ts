/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present in production
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

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    supabaseUrl: validateEnvVar(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    supabaseAnonKey: validateEnvVar(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    mapboxToken: validateEnvVar(
      'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    ),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'MNUDA',
    appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Minnesota Realtors Platform',
    isProduction,
    isDevelopment,
  };
}

// Validate environment variables on module load
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
