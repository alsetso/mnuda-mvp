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

export interface PersonRecord {
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
  rawResponse: any;
  source: string;
}

// Parser function
export function parseMainProperty(apiResponse: any): PropertyDetails {
  return {
    zpid: apiResponse.zpid ?? undefined,
    address: apiResponse.address?.streetAddress || apiResponse.abbreviatedAddress || "",
    city: apiResponse.address?.city || apiResponse.city || "",
    state: apiResponse.address?.state || "",
    zipcode: apiResponse.address?.zipcode || "",
    county: apiResponse.county || "",
    latitude: apiResponse.latitude ?? undefined,
    longitude: apiResponse.longitude ?? undefined,
    bedrooms: apiResponse.bedrooms ?? undefined,
    bathrooms: apiResponse.bathrooms ?? undefined,
    livingArea: apiResponse.livingArea ?? undefined,
    lotSize: apiResponse.lotSize ?? apiResponse.lotAreaValue ?? undefined,
    homeType: apiResponse.homeType ?? apiResponse.propertyTypeDimension ?? "",
    homeStatus: apiResponse.homeStatus ?? apiResponse.keystoneHomeStatus ?? "",
    yearBuilt: apiResponse.yearBuilt ?? undefined,
    price: apiResponse.price ?? apiResponse.listPriceLow ?? undefined,
    currency: apiResponse.currency ?? "USD",
    description: apiResponse.description ?? "",
    image: apiResponse.hiResImageLink || apiResponse.desktopWebHdpImageLink || "",
    url: apiResponse.hdpUrl
      ? `https://www.zillow.com${apiResponse.hdpUrl}`
      : undefined,
    lastSoldPrice: apiResponse.lastSoldPrice ?? undefined,
  };
}

// Parse person records from Skip Trace API
export function parsePersonRecords(apiResponse: any): PersonRecord[] {
  const persons: PersonRecord[] = [];

  // -------------------
  // Current Residents
  // -------------------
  (apiResponse["Person Details"] || []).forEach((p: any) => {
    persons.push({
      name: p.Person_name || '',
      age: p.Age || undefined,
      born: p.Born,
      lives_in: p["Lives in"],
      telephone: p.Telephone,
      category: 'resident',
      source: apiResponse.Source || 'Unknown'
    });
  });

  // -------------------
  // Relatives
  // -------------------
  (apiResponse["All Relatives"] || []).forEach((r: any) => {
    persons.push({
      name: r.Name || '',
      age: r.Age || undefined,
      person_link: r["Person Link"],
      person_id: r["Person ID"],
      category: 'relative',
      source: apiResponse.Source || 'Unknown'
    });
  });

  // -------------------
  // Associates
  // -------------------
  (apiResponse["All Associates"] || []).forEach((a: any) => {
    persons.push({
      name: a.Name || '',
      age: a.Age || undefined,
      person_link: a["Person Link"],
      person_id: a["Person ID"],
      category: 'associate',
      source: apiResponse.Source || 'Unknown'
    });
  });

  return persons;
}

export const propParseService = {
  parsePropertyResponse(apiResponse: any): FormattedPropertyData {
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
      source: apiResponse.Source || 'Unknown'
    };
  }
};
