// API service for property data calls
import { apiConfig, shouldUseMockData, getApiHeaders } from '../config/apiConfig';

// Global callback for API usage updates - will be set by the context provider
let _onApiUsageUpdate: (() => void) | null = null;

export const setApiUsageUpdateCallback = (callback: (() => void) | null) => {
  _onApiUsageUpdate = callback;
};

export interface ApiOption {
  id: string;
  name: string;
  description: string;
  curl: string;
  endpoint: string;
  headers: Record<string, string>;
}

export const apiOptions: ApiOption[] = [
  {
    id: 'zillow',
    name: 'Zillow Search',
    description: 'Search property data from Zillow API',
    curl: `curl --request GET \\
	--url 'https://zillow56.p.rapidapi.com/search_address?address=1161%20Natchez%20Dr%20College%20Station%20Texas%2077845' \\
	--header 'x-rapidapi-host: zillow56.p.rapidapi.com' \\
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
    endpoint: 'https://zillow56.p.rapidapi.com/search_address',
    headers: getApiHeaders('zillow')
  },
  {
    id: 'skip-trace',
    name: 'Skip Trace',
    description: 'Skip tracing and property owner data',
    curl: `curl --request GET \\
	--url 'https://skip-tracing-working-api.p.rapidapi.com/search/byaddress?street=3828%20Double%20Oak%20Ln&citystatezip=Irving%2C%20TX%2075061&page=1' \\
	--header 'x-rapidapi-host: skip-tracing-working-api.p.rapidapi.com' \\
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
    endpoint: 'https://skip-tracing-working-api.p.rapidapi.com/search/byaddress',
    headers: getApiHeaders('skipTrace')
  }
];

// Custom error class for credit exhaustion
export class CreditsExhaustedError extends Error {
  constructor(message: string = 'Daily API limit reached. Please try again tomorrow.') {
    super(message);
    this.name = 'CreditsExhaustedError';
  }
}

export const apiService = {
  async callZillowAPI(address: { street: string; city: string; state: string; zip: string }): Promise<unknown> {
    const fullAddress = `${address.street} ${address.city} ${address.state} ${address.zip}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `${apiConfig.zillow.endpoint}?address=${encodedAddress}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders('zillow')
    });

    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`);
    }

    return response.json();
  },

  async callSkipTraceAPI(address: { street: string; city: string; state: string; zip: string }): Promise<unknown> {
    // Check if we should use mock data
    if (shouldUseMockData('skipTrace')) {
      return this.getMockSkipTraceData(address);
    }
    
    const cityStateZip = `${address.city}, ${address.state} ${address.zip}`;
    const encodedStreet = encodeURIComponent(address.street);
    const encodedCityStateZip = encodeURIComponent(cityStateZip);
    const url = `${apiConfig.skipTrace.endpoint}?street=${encodedStreet}&citystatezip=${encodedCityStateZip}&page=1`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders('skipTrace')
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`Skip Trace API error: ${response.status} - ${response.statusText}`, errorText);
        throw new Error(`Skip Trace API error: ${response.status} - ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Skip Trace API request failed:', error);
      throw error;
    }
  },

  // Mock data for development when API fails
  getMockSkipTraceData(address: { street: string; city: string; state: string; zip: string }): unknown {
    return {
      success: true,
      data: [
        {
          "Person ID": "mock-person-1",
          "Name": "John Smith",
          "Age": "45",
          "Address": `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
          "Phone": "(555) 123-4567",
          "Email": "john.smith@email.com",
          "Relationship": "Property Owner"
        },
        {
          "Person ID": "mock-person-2", 
          "Name": "Jane Smith",
          "Age": "42",
          "Address": `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
          "Phone": "(555) 987-6543",
          "Email": "jane.smith@email.com",
          "Relationship": "Spouse"
        }
      ],
      message: "Mock data - API unavailable",
      total: 2
    };
  },

  async callPersonAPI(personId: string, retryCount = 0): Promise<unknown> {
    // Check and record API usage (only on first attempt, not retries)
    if (retryCount === 0) {
      // Usage tracking removed
    }
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/detailsbyID?peo_id=${personId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders('skipTrace')
    });

    if (!response.ok) {
      if (response.status === 429) {
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callPersonAPI(personId, retryCount + 1);
        }
        throw new Error(`Person API rate limit exceeded (429). Please wait before making another request.`);
      }
      throw new Error(`Person API error: ${response.status}`);
    }

    return response.json();
  },

  async callNameSearchAPI(name: { firstName: string; middleInitial?: string; lastName: string }): Promise<unknown> {
    // Format name as "FirstName MiddleInitial LastName" or "FirstName LastName"
    const fullName = name.middleInitial 
      ? `${name.firstName} ${name.middleInitial} ${name.lastName}`
      : `${name.firstName} ${name.lastName}`;
    
    const encodedName = encodeURIComponent(fullName);
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/byname?name=${encodedName}&page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders('skipTrace')
    });

    if (!response.ok) {
      throw new Error(`Name Search API error: ${response.status}`);
    }

    return response.json();
  },

  async callEmailSearchAPI(email: string): Promise<unknown> {
    const encodedEmail = encodeURIComponent(email);
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/byemail?email=${encodedEmail}&phone=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders('skipTrace')
    });

    if (!response.ok) {
      throw new Error(`Email Search API error: ${response.status}`);
    }

    return response.json();
  },

  async callPhoneSearchAPI(phone: string): Promise<unknown> {
    const encodedPhone = encodeURIComponent(phone);
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/byphone?phoneno=${encodedPhone}&page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders('skipTrace')
    });

    if (!response.ok) {
      throw new Error(`Phone Search API error: ${response.status}`);
    }

    return response.json();
  }
};
