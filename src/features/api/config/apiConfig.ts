// ============================================================================
// API CONFIGURATION
// ============================================================================
// Centralized API configuration for external services

export interface ApiConfig {
  skipTrace: {
    enabled: boolean;
    endpoint: string;
    host: string;
    key: string;
    useMockData: boolean;
  };
  zillow: {
    enabled: boolean;
    endpoint: string;
    host: string;
    key: string;
    useMockData: boolean;
  };
}

const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';
const hasApiKey = !!apiKey && 
  apiKey !== 'your_rapidapi_key_here' &&
  apiKey.trim() !== '';

export const apiConfig: ApiConfig = {
  skipTrace: {
    enabled: true,
    endpoint: 'https://skip-tracing-working-api.p.rapidapi.com/search/byaddress',
    host: 'skip-tracing-working-api.p.rapidapi.com',
    key: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !hasApiKey
  },
  zillow: {
    enabled: true,
    endpoint: 'https://zillow56.p.rapidapi.com/search_address',
    host: 'zillow56.p.rapidapi.com',
    key: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !hasApiKey
  }
};

// Helper function to check if we should use mock data
export const shouldUseMockData = (service: keyof ApiConfig): boolean => {
  return apiConfig[service].useMockData || !apiConfig[service].enabled;
};

// Helper function to get API headers
export const getApiHeaders = (service: keyof ApiConfig): Record<string, string> => {
  const config = apiConfig[service];
  return {
    [`x-rapidapi-host`]: config.host,
    [`x-rapidapi-key`]: config.key
  };
};
