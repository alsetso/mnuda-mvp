// API service for property data calls
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
	--header 'x-rapidapi-key: f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'`,
    endpoint: 'https://zillow56.p.rapidapi.com/search_address',
    headers: {
      'x-rapidapi-host': 'zillow56.p.rapidapi.com',
      'x-rapidapi-key': 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'
    }
  },
  {
    id: 'skip-trace',
    name: 'Skip Trace',
    description: 'Skip tracing and property owner data',
    curl: `curl --request GET \\
	--url 'https://skip-tracing-working-api.p.rapidapi.com/search/byaddress?street=3828%20Double%20Oak%20Ln&citystatezip=Irving%2C%20TX%2075061&page=1' \\
	--header 'x-rapidapi-host: skip-tracing-working-api.p.rapidapi.com' \\
	--header 'x-rapidapi-key: f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'`,
    endpoint: 'https://skip-tracing-working-api.p.rapidapi.com/search/byaddress',
    headers: {
      'x-rapidapi-host': 'skip-tracing-working-api.p.rapidapi.com',
      'x-rapidapi-key': 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'
    }
  }
];

export const apiService = {
  async callZillowAPI(address: { street: string; city: string; state: string; zip: string }): Promise<unknown> {
    console.log('Zillow API - Input address:', address);
    const fullAddress = `${address.street} ${address.city} ${address.state} ${address.zip}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://zillow56.p.rapidapi.com/search_address?address=${encodedAddress}`;
    
    console.log('Zillow API - Full address:', fullAddress);
    console.log('Zillow API - Encoded address:', encodedAddress);
    console.log('Zillow API - URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'zillow56.p.rapidapi.com',
        'x-rapidapi-key': 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'
      }
    });

    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`);
    }

    return response.json();
  },

  async callSkipTraceAPI(address: { street: string; city: string; state: string; zip: string }): Promise<unknown> {
    console.log('Skip Trace API - Input address:', address);
    const cityStateZip = `${address.city}, ${address.state} ${address.zip}`;
    const encodedStreet = encodeURIComponent(address.street);
    const encodedCityStateZip = encodeURIComponent(cityStateZip);
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/byaddress?street=${encodedStreet}&citystatezip=${encodedCityStateZip}&page=1`;
    
    console.log('Skip Trace API - Street:', address.street);
    console.log('Skip Trace API - City/State/Zip:', cityStateZip);
    console.log('Skip Trace API - Encoded street:', encodedStreet);
    console.log('Skip Trace API - URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'skip-tracing-working-api.p.rapidapi.com',
        'x-rapidapi-key': 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'
      }
    });

    if (!response.ok) {
      throw new Error(`Skip Trace API error: ${response.status}`);
    }

    return response.json();
  },

  async callPersonAPI(personId: string): Promise<unknown> {
    console.log('Person API - Input person ID:', personId);
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/detailsbyID?peo_id=${personId}`;
    
    console.log('Person API - URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'skip-tracing-working-api.p.rapidapi.com',
        'x-rapidapi-key': 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8'
      }
    });

    if (!response.ok) {
      throw new Error(`Person API error: ${response.status}`);
    }

    return response.json();
  }
};
