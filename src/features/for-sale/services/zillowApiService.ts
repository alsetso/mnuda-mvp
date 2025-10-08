// Zillow API Service for property listings
export interface ZillowProperty {
  zpid: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  propertyType: string;
  listingType: string;
  status: string;
  daysOnZillow: number;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
  yearBuilt?: number;
  parking?: string;
  heating?: string;
  cooling?: string;
  hoaFee?: number;
  propertyTax?: number;
  latitude?: number;
  longitude?: number;
  url?: string;
  // Enhanced fields from improved parsing
  county?: string;
  livingArea?: number;
  livingAreaUnits?: string;
  lotSizeUnits?: string;
  homeType?: string;
  homeStatus?: string;
  currency?: string;
  listingSubType?: {
    is_FSBA: boolean;
    is_FSBO: boolean;
    is_bankOwned: boolean;
    is_comingSoon: boolean;
    is_forAuction: boolean;
    is_foreclosure: boolean;
    is_newHome: boolean;
  };
  attributionInfo?: {
    agentName?: string;
    agentPhoneNumber?: string;
    agentEmail?: string;
    agentLicenseNumber?: string;
    brokerName?: string;
    brokerPhoneNumber?: string;
    buyerAgentName?: string;
    buyerBrokerageName?: string;
    coAgentName?: string;
    coAgentNumber?: string;
    lastChecked?: string;
    lastUpdated?: string;
    mlsId?: string;
    mlsName?: string;
    mlsDisclaimer?: string;
    listingAgreement?: string;
    listingAgents?: Array<{
      name?: string;
      phone?: string;
      email?: string;
      [key: string]: unknown;
    }>;
    listingOffices?: Array<{
      name?: string;
      phone?: string;
      [key: string]: unknown;
    }>;
    providerLogo?: string;
    attributionTitle?: string;
    trueStatus?: string;
  };
  images?: Array<{
    type: 'hero' | 'gallery' | 'street_view';
    url: string;
    caption: string;
  }>;
  priceHistory?: Array<{
    date: string;
    event: string;
    price: number;
    source: string;
  }>;
  taxHistory?: Array<{
    year: number;
    taxPaid: number;
    assessment: number;
  }>;
  metadata?: {
    canShowPriceHistory: boolean;
    canShowTaxHistory: boolean;
    listingStatus?: string;
    propertyStatus?: string;
    isZillowOwned: boolean;
  };
}

export interface ZillowSearchResponse {
  results: ZillowProperty[];
  resultsPerPage: number;
  totalPages: number;
  currentPage: number;
  totalResultCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ZillowSearchParams {
  location: string;
  page?: number;
  status?: 'forSale' | 'forRent' | 'sold';
  sortSelection?: 'priorityscore' | 'price' | 'beds' | 'baths' | 'sqft';
  listing_type?: 'by_agent' | 'by_owner' | 'new_construction';
  doz?: 'any' | '1' | '7' | '30' | '90';
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
}

export class ZillowApiService {
  private static readonly API_BASE_URL = 'https://zillow56.p.rapidapi.com';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8';

  /**
   * Search for properties using Zillow API
   */
  static async searchProperties(params: ZillowSearchParams): Promise<ZillowSearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        location: params.location,
        output: 'json',
        status: params.status || 'forSale',
        sortSelection: params.sortSelection || 'priorityscore',
        listing_type: params.listing_type || 'by_agent',
        doz: params.doz || 'any',
        ...(params.page && { page: params.page.toString() }),
        ...(params.minPrice && { minPrice: params.minPrice.toString() }),
        ...(params.maxPrice && { maxPrice: params.maxPrice.toString() }),
        ...(params.minBeds && { minBeds: params.minBeds.toString() }),
        ...(params.maxBeds && { maxBeds: params.maxBeds.toString() }),
        ...(params.minBaths && { minBaths: params.minBaths.toString() }),
        ...(params.maxBaths && { maxBaths: params.maxBaths.toString() }),
        ...(params.minSqft && { minSqft: params.minSqft.toString() }),
        ...(params.maxSqft && { maxSqft: params.maxSqft.toString() }),
      });

      const url = `${this.API_BASE_URL}/search?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'zillow56.p.rapidapi.com',
          'x-rapidapi-key': this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the API response to our interface
      return this.transformApiResponse(data, params.page || 1);
      
    } catch (error) {
      console.error('Error fetching properties from Zillow API:', error);
      throw new Error('Failed to fetch property listings. Please try again later.');
    }
  }

  /**
   * Transform Zillow API response to our interface
   */
  private static transformApiResponse(apiData: unknown, currentPage: number): ZillowSearchResponse {
    // The actual structure will depend on the Zillow API response
    // This is a placeholder transformation - adjust based on actual API response
    const properties: ZillowProperty[] = (apiData as { results?: Array<Record<string, unknown>> }).results?.map((item: Record<string, unknown>) => {
      const parsed = this.parseAddressResponse(item);
      return {
        zpid: (parsed.zpid || item.zpid || item.id || Math.random().toString()) as string,
        address: (parsed.address || this.extractAddressString(item)) as string,
        city: (parsed.city || this.extractCityString(item)) as string,
        state: (parsed.state || this.extractStateString(item)) as string,
        zipcode: (parsed.zipcode || this.extractZipcodeString(item)) as string,
        price: (parsed.price || this.parsePrice(item.price || item.listPrice || item.estimate || 0)) as number,
        bedrooms: (parsed.bedrooms || parseInt(String(item.bedrooms || item.beds || 0)) || 0) as number,
        bathrooms: (parsed.bathrooms || parseFloat(String(item.bathrooms || item.baths || 0)) || 0) as number,
        squareFeet: (parsed.livingArea || parseInt(String(item.squareFeet || item.sqft || item.livingArea || 0)) || 0) as number,
        lotSize: (parsed.lotSize || parseInt(String(item.lotSize || item.lotSizeSqft || 0)) || 0) as number,
        propertyType: (parsed.homeType || item.propertyType || item.homeType || 'Unknown') as string,
        listingType: (parsed.listingType || item.listingType || 'Unknown') as string,
        status: (parsed.homeStatus || item.status || 'Active') as string,
        daysOnZillow: (parseInt(String(item.daysOnZillow || item.daysOnMarket || 0)) || 0) as number,
        imageUrl: this.extractPrimaryImageUrl(item),
        imageUrls: this.extractImageUrls(item),
        description: (parsed.description || item.description || item.remarks || undefined) as string | undefined,
        yearBuilt: (parsed.yearBuilt || parseInt(String(item.yearBuilt || 0)) || undefined) as number | undefined,
        parking: (item.parking || undefined) as string | undefined,
        heating: (item.heating || undefined) as string | undefined,
        cooling: (item.cooling || undefined) as string | undefined,
        hoaFee: (this.parsePrice(item.hoaFee || 0)) as number,
        propertyTax: (this.parsePrice(item.propertyTax || item.taxAssessedValue || 0)) as number,
        latitude: (parsed.latitude || parseFloat(String(item.latitude || item.lat || 0)) || undefined) as number | undefined,
        longitude: (parsed.longitude || parseFloat(String(item.longitude || item.lng || 0)) || undefined) as number | undefined,
        url: (parsed.url || item.url || item.detailUrl || undefined) as string | undefined,
        // Enhanced fields
        county: parsed.county as string | undefined,
        livingArea: parsed.livingArea as number | undefined,
        livingAreaUnits: parsed.livingAreaUnits as string | undefined,
        lotSizeUnits: parsed.lotSizeUnits as string | undefined,
        homeType: parsed.homeType as string | undefined,
        homeStatus: parsed.homeStatus as string | undefined,
        currency: parsed.currency as string | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listingSubType: parsed.listingSubType as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributionInfo: parsed.attributionInfo as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: parsed.images as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        priceHistory: parsed.priceHistory as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        taxHistory: parsed.taxHistory as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: parsed.metadata as any,
      };
    }) || [];

    // Extract pagination data from API response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultsPerPage = (apiData as any).resultsPerPage || 20;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (apiData as any).totalPages || 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalResultCount = (apiData as any).totalResultCount || (apiData as any).totalResults || properties.length;

    return {
      results: properties,
      resultsPerPage,
      totalPages,
      currentPage,
      totalResultCount,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  /**
   * Extract address string from various formats
   */
  private static extractAddressString(item: Record<string, unknown>): string {
    // If address is a string, return it
    if (typeof item.address === 'string') {
      return item.address;
    }
    
    // If address is an object, try to construct from its properties
    if (typeof item.address === 'object' && item.address !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addr = item.address as any;
      if (addr.streetAddress) {
        return addr.streetAddress;
      }
      if (addr.street) {
        return addr.street;
      }
    }
    
    // Fallback to other possible fields
    return (item.streetAddress as string) || (item.street as string) || 'Address not available';
  }

  /**
   * Extract city string from various formats
   */
  private static extractCityString(item: Record<string, unknown>): string {
    // If city is a string, return it
    if (typeof item.city === 'string') {
      return item.city;
    }
    
    // If city is an object, try to get the city property
    if (typeof item.city === 'object' && item.city !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cityObj = item.city as any;
      return cityObj.city || cityObj.name || 'City not available';
    }
    
    // Check if address object has city
    if (typeof item.address === 'object' && item.address !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addr = item.address as any;
      return addr.city || 'City not available';
    }
    
    return 'City not available';
  }

  /**
   * Extract state string from various formats
   */
  private static extractStateString(item: Record<string, unknown>): string {
    // If state is a string, return it
    if (typeof item.state === 'string') {
      return item.state;
    }
    
    // If state is an object, try to get the state property
    if (typeof item.state === 'object' && item.state !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateObj = item.state as any;
      return stateObj.state || stateObj.name || 'MN';
    }
    
    // Check if address object has state
    if (typeof item.address === 'object' && item.address !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addr = item.address as any;
      return addr.state || 'MN';
    }
    
    return 'MN';
  }

  /**
   * Extract zipcode string from various formats
   */
  private static extractZipcodeString(item: Record<string, unknown>): string {
    // If zipcode is a string, return it
    if (typeof item.zipcode === 'string') {
      return item.zipcode;
    }
    
    // If zipcode is a number, convert to string
    if (typeof item.zipcode === 'number') {
      return item.zipcode.toString();
    }
    
    // If zipcode is an object, try to get the zipcode property
    if (typeof item.zipcode === 'object' && item.zipcode !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zipObj = item.zipcode as any;
      return zipObj.zipcode || zipObj.zip || '';
    }
    
    // Check if address object has zipcode
    if (typeof item.address === 'object' && item.address !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addr = item.address as any;
      return addr.zipcode || addr.zip || '';
    }
    
    // Fallback to other possible fields
    return (item.zipCode as string) || (item.zip as string) || '';
  }

  /**
   * Validate and clean image URL
   */
  private static validateImageUrl(url: string): string | undefined {
    if (!url || typeof url !== 'string') {
      return undefined;
    }
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return undefined;
    }
    
    // Only reject specific Google Maps URLs that are clearly not images
    if (trimmedUrl.includes('maps.googleapis.com/maps/api/streetview') ||
        trimmedUrl.includes('maps.googleapis.com/maps/api/staticmap') ||
        trimmedUrl.includes('google.com/maps/embed') ||
        trimmedUrl.includes('google.com/maps/place')) {
      return undefined;
    }
    
    // Basic URL validation - be more permissive
    try {
      // Use URL constructor safely
      new URL(trimmedUrl);
      console.log('Accepting valid URL:', trimmedUrl);
      return trimmedUrl;
    } catch (error) {
      // If it's not a full URL, it might be a relative path
      if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./')) {
        console.log('Accepting relative path:', trimmedUrl);
        return trimmedUrl;
      }
      console.log('Rejecting invalid URL:', trimmedUrl, error);
      return undefined;
    }
  }

  /**
   * Extract primary image URL from various possible fields
   */
  private static extractPrimaryImageUrl(item: Record<string, unknown>): string | undefined {
    // Priority order for finding the best primary image
    const imageFields = [
      'imgSrc',        // Zillow's primary image field
      'imageUrl',
      'primaryPhoto', 
      'heroImage',
      'thumbnail',
      'photo',
      'mainImage',
      'featuredImage'
    ];

    for (const field of imageFields) {
      const value = item[field];
      const validatedUrl = this.validateImageUrl(value as string);
      if (validatedUrl) {
        return validatedUrl;
      }
    }

    // If no single image found, try to get the first image from an array
    const arrayFields = ['imageUrls', 'photos', 'images'];
    for (const field of arrayFields) {
      const value = item[field];
      if (Array.isArray(value) && value.length > 0) {
        const firstImage = value[0];
        const validatedUrl = this.validateImageUrl(firstImage);
        if (validatedUrl) {
          return validatedUrl;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract all image URLs from various possible fields
   */
  private static extractImageUrls(item: Record<string, unknown>): string[] {
    const imageUrls: string[] = [];

    // Check array fields first
    const arrayFields = ['imageUrls', 'photos', 'images', 'gallery'];
    for (const field of arrayFields) {
      const value = item[field];
      if (Array.isArray(value)) {
        for (const image of value) {
          const validatedUrl = this.validateImageUrl(image);
          if (validatedUrl && !imageUrls.includes(validatedUrl)) {
            imageUrls.push(validatedUrl);
          }
        }
      }
    }

    // Add single image fields if not already included
    const singleFields = [
      'imgSrc',        // Zillow's primary image field
      'imageUrl',
      'primaryPhoto', 
      'heroImage',
      'thumbnail',
      'photo',
      'mainImage',
      'featuredImage'
    ];

    for (const field of singleFields) {
      const value = item[field];
      const validatedUrl = this.validateImageUrl(value as string);
      if (validatedUrl && !imageUrls.includes(validatedUrl)) {
        imageUrls.push(validatedUrl);
      }
    }

    return imageUrls;
  }

  /**
   * Parse price from various formats
   */
  private static parsePrice(price: unknown): number {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      // Remove currency symbols and commas
      const cleaned = price.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Get property details by ZPID
   */
  static async getPropertyDetails(zpid: string): Promise<ZillowProperty | null> {
    try {
      const url = `${this.API_BASE_URL}/property?zpid=${zpid}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'zillow56.p.rapidapi.com',
          'x-rapidapi-key': this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform single property response
      const properties = this.transformApiResponse({ results: [data] }, 1);
      return properties.results[0] || null;
      
    } catch (error) {
      console.error('Error fetching property details from Zillow API:', error);
      return null;
    }
  }

  /**
   * Get property photos by ZPID
   */
  static async getPropertyPhotos(zpid: string): Promise<string[]> {
    try {
      const url = `${this.API_BASE_URL}/photos?zpid=${zpid}`;
      
      console.log('Fetching photos for ZPID:', zpid, 'URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'zillow56.p.rapidapi.com',
          'x-rapidapi-key': this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Zillow Photos API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Photos API response for ZPID:', zpid, data);
      
      // Extract photo URLs from the response
      const photoUrls = this.extractPhotoUrlsFromResponse(data);
      console.log('Extracted photo URLs for ZPID:', zpid, photoUrls);
      
      return photoUrls;
      
    } catch (error) {
      console.error('Error fetching property photos from Zillow API for ZPID:', zpid, error);
      return [];
    }
  }

  /**
   * Extract photo URLs from the photos API response
   */
  private static extractPhotoUrlsFromResponse(data: Record<string, unknown>): string[] {
    const photoUrls: string[] = [];

    // Handle different possible response structures
    if (Array.isArray(data)) {
      // If response is directly an array of photos
      for (const photo of data) {
        this.extractUrlsFromPhotoObject(photo, photoUrls);
      }
    } else if (typeof data === 'object' && data !== null) {
      // If response is an object with photos array
      const photosArray = data.photos || data.images || data.gallery || data.photoUrls;
      if (Array.isArray(photosArray)) {
        for (const photo of photosArray) {
          this.extractUrlsFromPhotoObject(photo, photoUrls);
        }
      }
    }

    return photoUrls;
  }

  /**
   * Extract URLs from a single photo object, handling various structures
   */
  private static extractUrlsFromPhotoObject(photo: Record<string, unknown>, photoUrls: string[]): void {
    if (typeof photo === 'string') {
      const validatedUrl = this.validateImageUrl(photo);
      if (validatedUrl) {
        photoUrls.push(validatedUrl);
      }
      return;
    }

    if (typeof photo !== 'object' || photo === null) {
      return;
    }

    // Handle the actual Zillow API response structure with mixedSources
    if (photo.mixedSources) {
      const mixedSources = photo.mixedSources as Record<string, unknown>;
      // Prefer JPEG over WebP for better compatibility
      const jpegSources = (mixedSources.jpeg as Array<{ url: string; width?: number }>) || [];
      const webpSources = (mixedSources.webp as Array<{ url: string; width?: number }>) || [];
      
      // Try to get the highest resolution JPEG first
      const sortedJpeg = jpegSources.sort((a: { width?: number }, b: { width?: number }) => (b.width || 0) - (a.width || 0));
      for (const source of sortedJpeg) {
        const validatedUrl = this.validateImageUrl(source.url);
        if (validatedUrl && !photoUrls.includes(validatedUrl)) {
          photoUrls.push(validatedUrl);
          break; // Only take one URL per photo object
        }
      }
      
      // If no JPEG found, try WebP
      if (photoUrls.length === 0 || !photoUrls.some(url => url.includes(jpegSources[0]?.url || ''))) {
        const sortedWebp = webpSources.sort((a: { width?: number }, b: { width?: number }) => (b.width || 0) - (a.width || 0));
        for (const source of sortedWebp) {
          const validatedUrl = this.validateImageUrl(source.url);
          if (validatedUrl && !photoUrls.includes(validatedUrl)) {
            photoUrls.push(validatedUrl);
            break;
          }
        }
      }
    } else {
      // Fallback to simple URL fields for other response structures
      const urlFields = ['url', 'src', 'imageUrl', 'photoUrl', 'href'];
      for (const field of urlFields) {
        const urlValue = photo[field];
        if (typeof urlValue === 'string') {
          const validatedUrl = this.validateImageUrl(urlValue);
          if (validatedUrl && !photoUrls.includes(validatedUrl)) {
            photoUrls.push(validatedUrl);
            break; // Use first valid URL from this photo object
          }
        }
      }
    }
  }

  /**
   * Normalize a Zillow-like /address API raw response
   * into a unified property data structure.
   */
  private static parseAddressResponse(apiResponse: Record<string, unknown>): Record<string, unknown> {
    // Normalize root vs nested structure
    const property = (apiResponse.property || apiResponse) as Record<string, unknown>;
    const meta = (property.listingMetadata as Record<string, unknown>) || {};

    // ------------------------------
    // 1️⃣ Basic Property Information
    // ------------------------------
    const propertyData: Record<string, unknown> = {
      zpid: (property.zpid as string) || null,
      address: ((property.address as Record<string, unknown>)?.streetAddress as string) ||
               (property.abbreviatedAddress as string) ||
               (property.displayAddress as string) ||
               "",
      city: ((property.address as Record<string, unknown>)?.city as string) || (property.city as string) || "",
      state: ((property.address as Record<string, unknown>)?.state as string) || (property.state as string) || "",
      zipcode: ((property.address as Record<string, unknown>)?.zipcode as string) || (property.zipcode as string) || "",
      county: (property.county as string) || ((property.address as Record<string, unknown>)?.county as string) || null,
      latitude: (property.latitude as number) || null,
      longitude: (property.longitude as number) || null,
      bedrooms: (property.bedrooms as number) || null,
      bathrooms: (property.bathrooms as number) || null,
      livingArea: (property.livingAreaValue as number) || (property.livingArea as number) || null,
      livingAreaUnits: (property.livingAreaUnitsShort as string) ||
                       (property.livingAreaUnits as string) ||
                       "sqft",
      lotSize: (property.lotAreaValue as number) || (property.lotSize as number) || null,
      lotSizeUnits: (property.lotAreaUnits as string) || "sqft",
      yearBuilt: (property.yearBuilt as number) || null,
      homeType: (property.homeType as string) ||
                (property.propertyTypeDimension as string) ||
                (property.listingTypeDimension as string) ||
                null,
      homeStatus: (property.homeStatus as string) ||
                  (property.keystoneHomeStatus as string) ||
                  (property.homeStatusDimension as string) ||
                  null,
      price: (property.price as number) ||
             (property.listPriceLow as number) ||
             (property.listPrice as number) ||
             (property.lastSoldPrice as number) ||
             null,
      currency: (property.currency as string) || "USD",
      description: (property.description as string) || null,
      url: (property.hdpUrl as string)
        ? `https://www.zillow.com${property.hdpUrl as string}`
        : null,
    };

    // ---------------------------------
    // 2️⃣ Listing Type and Sub-Type
    // ---------------------------------
    propertyData.listingType =
      (property.listingTypeDimension as string) ||
      (property.homeType as string) ||
      null;

    propertyData.listingSubType = (property.listing_sub_type as Record<string, unknown>) || {
      is_FSBA: false,
      is_FSBO: false,
      is_bankOwned: false,
      is_comingSoon: false,
      is_forAuction: false,
      is_foreclosure: false,
      is_newHome: false,
    };

    // ------------------------------
    // 3️⃣ Attribution / Agent Info
    // ------------------------------
    const att = (property.attributionInfo as Record<string, unknown>) || {};
    propertyData.attributionInfo = {
      agentName: (att.agentName as string) || null,
      agentPhoneNumber: (att.agentPhoneNumber as string) || null,
      agentEmail: (att.agentEmail as string) || null,
      agentLicenseNumber: (att.agentLicenseNumber as string) || null,
      brokerName: (att.brokerName as string) || null,
      brokerPhoneNumber: (att.brokerPhoneNumber as string) || null,
      buyerAgentName: (att.buyerAgentName as string) || null,
      buyerBrokerageName: (att.buyerBrokerageName as string) || null,
      coAgentName: (att.coAgentName as string) || null,
      coAgentNumber: (att.coAgentNumber as string) || null,
      lastChecked: (att.lastChecked as string) || null,
      lastUpdated: (att.lastUpdated as string) || null,
      mlsId: (att.mlsId as string) || null,
      mlsName: (att.mlsName as string) || null,
      mlsDisclaimer: (att.mlsDisclaimer as string) || "",
      listingAgreement: (att.listingAgreement as string) || null,
      listingAgents: (att.listingAgents as unknown[]) || [],
      listingOffices: (att.listingOffices as unknown[]) || [],
      providerLogo: (att.providerLogo as string) || null,
      attributionTitle: (att.attributionTitle as string) || null,
      trueStatus: (att.trueStatus as string) || null,
    };

    // ---------------------------------
    // 4️⃣ Images (Hero + Gallery)
    // ---------------------------------
    const images = [];

    if (property.hiResImageLink) {
      images.push({
        type: "hero",
        url: property.hiResImageLink as string,
        caption: "Main Photo",
      });
    } else if (property.desktopWebHdpImageLink) {
      images.push({
        type: "hero",
        url: property.desktopWebHdpImageLink as string,
        caption: "Main Photo",
      });
    }

    // Add gallery / thumbnails
    ((property.miniCardPhotos as unknown[]) || (property.photos as unknown[]) || []).forEach((p: unknown, i: number) => {
      const photo = p as Record<string, unknown>;
      if (photo.url) {
        images.push({
          type: "gallery",
          url: photo.url as string,
          caption: (photo.caption as string) || `Photo ${i + 1}`,
        });
      }
    });

    // Street View fallback
    if ((property.address as Record<string, unknown>)?.streetAddress) {
      images.push({
        type: "street_view",
        url: `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${encodeURIComponent(
          ((property.address as Record<string, unknown>).streetAddress as string)
        )}`,
        caption: "Street View",
      });
    }

    propertyData.images = images;

    // ---------------------------------
    // 5️⃣ Price & Tax History
    // ---------------------------------
    propertyData.priceHistory = ((property.priceHistory as unknown[]) || []).map((ph: unknown) => {
      const priceHistory = ph as Record<string, unknown>;
      return {
        date: (priceHistory.date as string) || (priceHistory.time as string) || "",
        event: (priceHistory.event as string) || (priceHistory.priceChangeReason as string) || "",
        price: (priceHistory.price as number) || (priceHistory.value as number) || null,
        source: (priceHistory.source as string) || "Zillow",
      };
    });

    propertyData.taxHistory = ((property.taxHistory as unknown[]) || []).map((tx: unknown) => {
      const taxHistory = tx as Record<string, unknown>;
      return {
        year: (taxHistory.taxYear as number) || null,
        taxPaid: (taxHistory.taxPaid as number) || null,
        assessment: (taxHistory.assessedValue as number) || null,
      };
    });

    // ---------------------------------
    // 6️⃣ Metadata Flags
    // ---------------------------------
    propertyData.metadata = {
      canShowPriceHistory: (meta.canShowPriceHistory as boolean) ?? true,
      canShowTaxHistory: (meta.canShowTaxHistory as boolean) ?? true,
      listingStatus: (meta.listingStatus as string) || (property.statusType as string) || null,
      propertyStatus: (property.homeStatus as string) || null,
      isZillowOwned: (meta.isZillowOwned as boolean) || false,
    };

    // ---------------------------------
    // 7️⃣ Return Unified Result
    // ---------------------------------
    return propertyData;
  }

  /**
   * Format price for display
   */
  static formatPrice(price: number): string {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price.toLocaleString()}`;
    }
  }

  /**
   * Format square footage for display
   */
  static formatSquareFeet(sqft: number): string {
    if (sqft >= 1000) {
      return `${(sqft / 1000).toFixed(1)}K sq ft`;
    } else {
      return `${sqft.toLocaleString()} sq ft`;
    }
  }

  /**
   * Format lot size for display
   */
  static formatLotSize(lotSize: number): string {
    if (lotSize >= 43560) { // 1 acre = 43,560 sq ft
      const acres = lotSize / 43560;
      return `${acres.toFixed(1)} acres`;
    } else if (lotSize >= 1000) {
      return `${(lotSize / 1000).toFixed(1)}K sq ft`;
    } else {
      return `${lotSize.toLocaleString()} sq ft`;
    }
  }
}
