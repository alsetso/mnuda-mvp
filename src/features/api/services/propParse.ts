// Property parsing service for converting raw API responses into formatted data

// Define the shape of parsed property details
export interface PropertyDetails {
  zpid?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  lotSize?: number;
  homeType?: string;
  homeStatus?: string;
  yearBuilt?: number;
  price?: number;
  currency?: string;
  description?: string;
  image?: string; // main photo
  url?: string;   // Zillow HDP URL
  lastSoldPrice?: number;
}

export interface PropertyPersonRecord {
  name: string;
  age?: number;
  born?: string;
  lives_in?: string;
  telephone?: string;
  person_link?: string;
  person_id?: string;
  category?: 'resident' | 'relative' | 'associate';
  source: string;
}

export interface FormattedPropertyData {
  // Property Summary
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  
  // Raw data
  rawResponse: unknown;
  source: string;
}

// API Response Types
interface PropertyApiResponse {
  zpid?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  abbreviatedAddress?: string;
  city?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  lotSize?: number;
  lotAreaValue?: number;
  homeType?: string;
  propertyTypeDimension?: string;
  homeStatus?: string;
  keystoneHomeStatus?: string;
  yearBuilt?: number;
  listPriceLow?: number;
  currency?: string;
  description?: string;
  image?: string;
  hiResImageLink?: string;
  desktopWebHdpImageLink?: string;
  url?: string;
  hdpUrl?: string;
  lastSoldPrice?: number;
}

// Parser function
export function parseMainProperty(apiResponse: unknown): PropertyDetails {
  const response = apiResponse as PropertyApiResponse;
  return {
    zpid: response.zpid ?? undefined,
    address: response.address?.streetAddress || response.abbreviatedAddress || "",
    city: response.address?.city || response.city || "",
    state: response.address?.state || "",
    zipcode: response.address?.zipcode || "",
    county: response.county || "",
    latitude: response.latitude ?? undefined,
    longitude: response.longitude ?? undefined,
    bedrooms: response.bedrooms ?? undefined,
    bathrooms: response.bathrooms ?? undefined,
    livingArea: response.livingArea ?? undefined,
    lotSize: response.lotSize ?? response.lotAreaValue ?? undefined,
    homeType: response.homeType ?? response.propertyTypeDimension ?? "",
    homeStatus: response.homeStatus ?? response.keystoneHomeStatus ?? "",
    yearBuilt: response.yearBuilt ?? undefined,
    price: response.price ?? response.listPriceLow ?? undefined,
    currency: response.currency ?? "USD",
    description: response.description ?? "",
    image: response.hiResImageLink || response.desktopWebHdpImageLink || "",
    url: response.hdpUrl
      ? `https://www.zillow.com${response.hdpUrl}`
      : undefined,
    lastSoldPrice: response.lastSoldPrice ?? undefined,
  };
}

// Person API Response Types
interface PersonApiResponse {
  Source?: string;
  "Person Details"?: Array<{
    Person_name?: string;
    Age?: number;
    Born?: string;
    "Lives in"?: string;
    Telephone?: string;
  }>;
  "All Relatives"?: Array<{
    Name?: string;
    Age?: number;
    "Person Link"?: string;
    "Person ID"?: string;
  }>;
  "All Associates"?: Array<{
    Name?: string;
    Age?: number;
    "Person Link"?: string;
    "Person ID"?: string;
  }>;
}

// Parse person records from Skip Trace API
export function parsePersonRecords(apiResponse: unknown): PropertyPersonRecord[] {
  const response = apiResponse as PersonApiResponse;
  const persons: PropertyPersonRecord[] = [];

  // -------------------
  // Current Residents
  // -------------------
  (response["Person Details"] || []).forEach((p) => {
    persons.push({
      name: p.Person_name || '',
      age: p.Age || undefined,
      born: p.Born,
      lives_in: p["Lives in"],
      telephone: p.Telephone,
      category: 'resident',
      source: response.Source || 'Unknown'
    });
  });

  // -------------------
  // Relatives
  // -------------------
  (response["All Relatives"] || []).forEach((r) => {
    persons.push({
      name: r.Name || '',
      age: r.Age || undefined,
      person_link: r["Person Link"],
      person_id: r["Person ID"],
      category: 'relative',
      source: response.Source || 'Unknown'
    });
  });

  // -------------------
  // Associates
  // -------------------
  (response["All Associates"] || []).forEach((a) => {
    persons.push({
      name: a.Name || '',
      age: a.Age || undefined,
      person_link: a["Person Link"],
      person_id: a["Person ID"],
      category: 'associate',
      source: response.Source || 'Unknown'
    });
  });

  return persons;
}

export const propParseService = {
  parsePropertyResponse(apiResponse: unknown): FormattedPropertyData {
    // Use the comprehensive parser
    const propertyDetails = parseMainProperty(apiResponse);
    
    return {
      // Property Summary - map from PropertyDetails
      price: propertyDetails.price,
      bedrooms: propertyDetails.bedrooms,
      bathrooms: propertyDetails.bathrooms,
      squareFeet: propertyDetails.livingArea,
      lotSize: propertyDetails.lotSize,
      yearBuilt: propertyDetails.yearBuilt,
      propertyType: propertyDetails.homeType,
      
      // Raw data
      rawResponse: apiResponse,
      source: (apiResponse as { Source?: string }).Source || 'Unknown'
    };
  }
};
