// Property parsing service for converting raw API responses into formatted data

export interface PriceHistoryEntry {
  date: string;
  event: string;
  price: number;
  source?: string;
}

export interface TaxHistoryEntry {
  year: number;
  taxPaid: number;
  assessment: number;
}

export interface PropertyImage {
  url: string;
  caption?: string;
  type: "hero" | "gallery" | "thumbnail";
}

export interface AttributionInfo {
  agentEmail?: string | null;
  agentLicenseNumber?: string | null;
  agentName?: string | null;
  agentPhoneNumber?: string | null;
  attributionTitle?: string | null;
  brokerName?: string | null;
  brokerPhoneNumber?: string | null;
  buyerAgentMemberStateLicense?: string | null;
  buyerAgentName?: string | null;
  buyerBrokerageName?: string | null;
  coAgentLicenseNumber?: string | null;
  coAgentName?: string | null;
  coAgentNumber?: string | null;
  lastChecked?: string | null;
  lastUpdated?: string | null;
  listingAgreement?: string | null;
  listingAgents?: Array<{ [key: string]: unknown }>;
  listingAttributionContact?: string | null;
  listingOffices?: Array<{ [key: string]: unknown }>;
  mlsDisclaimer?: string | null;
  mlsId?: string | null;
  mlsName?: string | null;
  providerLogo?: string | null;
  trueStatus?: string | null;
}

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
  livingAreaUnits?: string;
  lotSize?: number;
  lotSizeUnits?: string;
  homeType?: string;
  homeStatus?: string;
  yearBuilt?: number;
  price?: number;
  currency?: string;
  description?: string;
  url?: string;
  lastSoldPrice?: number;
  listingType?: string;
  listingSubType?: {
    is_FSBA?: boolean;
    is_FSBO?: boolean;
    is_bankOwned?: boolean;
    is_comingSoon?: boolean;
    is_forAuction?: boolean;
    is_foreclosure?: boolean;
    is_newHome?: boolean;
  };

  // Extended fields
  images: PropertyImage[];
  priceHistory: PriceHistoryEntry[];
  taxHistory: TaxHistoryEntry[];
  attributionInfo: AttributionInfo;
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
  
  // Extended fields for images, price history, tax history
  miniCardPhotos?: Array<{ url?: string; caption?: string }>;
  priceHistory?: Array<{
    date?: string;
    time?: string;
    event?: string;
    priceChangeReason?: string;
    price?: number;
    value?: number;
    source?: string;
  }>;
  taxHistory?: Array<{
    taxYear?: number;
    taxPaid?: number;
    assessedValue?: number;
  }>;
  
  // Additional fields for attribution, listing, and units
  attributionInfo?: {
    agentEmail?: string | null;
    agentLicenseNumber?: string | null;
    agentName?: string | null;
    agentPhoneNumber?: string | null;
    attributionTitle?: string | null;
    brokerName?: string | null;
    brokerPhoneNumber?: string | null;
    buyerAgentMemberStateLicense?: string | null;
    buyerAgentName?: string | null;
    buyerBrokerageName?: string | null;
    coAgentLicenseNumber?: string | null;
    coAgentName?: string | null;
    coAgentNumber?: string | null;
    lastChecked?: string | null;
    lastUpdated?: string | null;
    listingAgreement?: string | null;
    listingAgents?: Array<{ [key: string]: unknown }>;
    listingAttributionContact?: string | null;
    listingOffices?: Array<{ [key: string]: unknown }>;
    mlsDisclaimer?: string | null;
    mlsId?: string | null;
    mlsName?: string | null;
    providerLogo?: string | null;
    trueStatus?: string | null;
  };
  listingTypeDimension?: string;
  listing_sub_type?: {
    is_FSBA?: boolean;
    is_FSBO?: boolean;
    is_bankOwned?: boolean;
    is_comingSoon?: boolean;
    is_forAuction?: boolean;
    is_foreclosure?: boolean;
    is_newHome?: boolean;
  };
  livingAreaValue?: number;
  livingAreaUnitsShort?: string;
  lotAreaUnits?: string;
}

// Parser function
export function parseMainProperty(apiResponse: unknown): PropertyDetails {
  const response = apiResponse as PropertyApiResponse;
  
  // Check if there's a property object, otherwise use root level
  const propertyData = (response as { property?: PropertyApiResponse }).property || response;
  
  const images: PropertyImage[] = [];

  // Hero images
  if (propertyData.hiResImageLink) {
    images.push({ url: propertyData.hiResImageLink, type: "hero" });
  } else if (propertyData.desktopWebHdpImageLink) {
    images.push({ url: propertyData.desktopWebHdpImageLink, type: "hero" });
  }

  // Thumbnails (e.g. from similar listings or miniCardPhotos)
  (propertyData.miniCardPhotos || []).forEach((p: { url?: string; [key: string]: unknown }) => {
    if (p.url) {
      images.push({ url: p.url, type: "thumbnail" });
    }
  });

  // Price history (if available) - check property.priceHistory first, then root
  const priceHistoryData = propertyData.priceHistory || response.priceHistory || [];
  const priceHistory: PriceHistoryEntry[] = priceHistoryData.map((entry: { [key: string]: unknown }) => ({
    date: (entry.date as string) || (entry.time as string) || "",
    event: (entry.event as string) || (entry.priceChangeReason as string) || "",
    price: (entry.price as number) || (entry.value as number) || 0,
    source: (entry.source as string) || "Zillow",
  }));

  // Tax history (if available) - check property.taxHistory first, then root
  const taxHistoryData = propertyData.taxHistory || response.taxHistory || [];
  const taxHistory: TaxHistoryEntry[] = taxHistoryData.map((entry: { [key: string]: unknown }) => ({
    year: (entry.taxYear as number) || 0,
    taxPaid: (entry.taxPaid as number) || 0,
    assessment: (entry.assessedValue as number) || 0,
  }));

  // Attribution info - check property.attributionInfo first, then root
  const attributionData = propertyData.attributionInfo || response.attributionInfo;
  const attributionInfo: AttributionInfo = {
    agentEmail: attributionData?.agentEmail ?? null,
    agentLicenseNumber: attributionData?.agentLicenseNumber ?? null,
    agentName: attributionData?.agentName ?? null,
    agentPhoneNumber: attributionData?.agentPhoneNumber ?? null,
    attributionTitle: attributionData?.attributionTitle ?? null,
    brokerName: attributionData?.brokerName ?? null,
    brokerPhoneNumber: attributionData?.brokerPhoneNumber ?? null,
    buyerAgentMemberStateLicense: attributionData?.buyerAgentMemberStateLicense ?? null,
    buyerAgentName: attributionData?.buyerAgentName ?? null,
    buyerBrokerageName: attributionData?.buyerBrokerageName ?? null,
    coAgentLicenseNumber: attributionData?.coAgentLicenseNumber ?? null,
    coAgentName: attributionData?.coAgentName ?? null,
    coAgentNumber: attributionData?.coAgentNumber ?? null,
    lastChecked: attributionData?.lastChecked ?? null,
    lastUpdated: attributionData?.lastUpdated ?? null,
    listingAgreement: attributionData?.listingAgreement ?? null,
    listingAgents: attributionData?.listingAgents ?? [],
    listingAttributionContact: attributionData?.listingAttributionContact ?? null,
    listingOffices: attributionData?.listingOffices ?? [],
    mlsDisclaimer: attributionData?.mlsDisclaimer ?? null,
    mlsId: attributionData?.mlsId ?? null,
    mlsName: attributionData?.mlsName ?? null,
    providerLogo: attributionData?.providerLogo ?? null,
    trueStatus: attributionData?.trueStatus ?? null,
  };

  return {
    zpid: propertyData.zpid ?? undefined,
    address: propertyData.address?.streetAddress || propertyData.abbreviatedAddress || "",
    city: propertyData.address?.city || propertyData.city || "",
    state: propertyData.address?.state || "",
    zipcode: propertyData.address?.zipcode || "",
    county: propertyData.county || "",
    latitude: propertyData.latitude ?? undefined,
    longitude: propertyData.longitude ?? undefined,
    bedrooms: propertyData.bedrooms ?? undefined,
    bathrooms: propertyData.bathrooms ?? undefined,
    livingArea: propertyData.livingAreaValue ?? propertyData.livingArea ?? undefined,
    livingAreaUnits: propertyData.livingAreaUnitsShort || "sqft",
    lotSize: propertyData.lotAreaValue ?? propertyData.lotSize ?? undefined,
    lotSizeUnits: propertyData.lotAreaUnits || "sqft",
    homeType: propertyData.homeType ?? propertyData.propertyTypeDimension ?? "",
    homeStatus: propertyData.homeStatus ?? propertyData.keystoneHomeStatus ?? "",
    yearBuilt: propertyData.yearBuilt ?? undefined,
    price: propertyData.price ?? propertyData.listPriceLow ?? propertyData.lastSoldPrice ?? undefined,
    currency: propertyData.currency ?? "USD",
    description: propertyData.description ?? "",
    url: propertyData.hdpUrl ? `https://www.zillow.com${propertyData.hdpUrl}` : undefined,
    lastSoldPrice: propertyData.lastSoldPrice ?? undefined,
    listingType: propertyData.listingTypeDimension ?? undefined,
    listingSubType: propertyData.listing_sub_type || {},

    // Extended fields
    images,
    priceHistory,
    taxHistory,
    attributionInfo,
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
