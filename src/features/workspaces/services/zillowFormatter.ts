/**
 * 🧩 formatZillowResponse(raw: any)
 * 
 * 1. Parse the Zillow API response into a simple data table format.
 * 2. Keep only primary fields that represent property identity, price, location, stats, and metadata.
 * 3. Flatten nested structures like `address`, `resoFacts`, and `attributionInfo`.
 * 4. Convert arrays (like photos, schools, priceHistory, taxHistory) into summarized or compact versions:
 *    - photos: only keep the first image URL
 *    - schools: map to [{name, rating, distance}]
 *    - priceHistory: map to last 5 events [{date, event, price}]
 *    - taxHistory: map to last 5 entries [{year, value, taxPaid}]
 * 5. Return an object that looks like this:
 * 
 * {
 *   id: string,
 *   zpid: number,
 *   street_address: string,
 *   city: string,
 *   state: string,
 *   zipcode: string,
 *   county: string,
 *   latitude: number,
 *   longitude: number,
 *   bedrooms: number,
 *   bathrooms: number,
 *   living_area: number,
 *   lot_size: number,
 *   year_built: number,
 *   home_type: string,
 *   home_status: string,
 *   price: number,
 *   zestimate: number,
 *   rent_zestimate: number,
 *   tax_assessed_value: number,
 *   tax_annual_amount: number,
 *   favorite_count: number,
 *   page_view_count: number,
 *   description: string,
 *   image_url: string,
 *   school_summary: string, // joined text like "Big Woods Elementary (10/10), STMA High (9/10)"
 *   last_sold_date: string,
 *   last_sold_price: number,
 *   price_history: JSON[], // compact array
 *   tax_history: JSON[],
 *   created_at: new Date()
 * }
 */

interface RawZillowSchool {
  name?: string;
  rating?: number | string;
}

interface RawZillowTaxEntry {
  time?: string | number;
  value?: number;
  taxPaid?: number;
}

interface RawZillowPriceEntry {
  date?: string;
  event?: string;
  price?: number;
}

interface RawZillowAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

interface RawZillowResoFacts {
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  livingArea?: number;
  yearBuilt?: number;
  homeType?: string;
  taxAssessedValue?: number;
  taxAnnualAmount?: number;
}

interface RawZillowResponse {
  id?: string;
  zpid?: number;
  address?: RawZillowAddress;
  resoFacts?: RawZillowResoFacts;
  schools?: RawZillowSchool[];
  taxHistory?: RawZillowTaxEntry[];
  priceHistory?: RawZillowPriceEntry[];
  county?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  livingArea?: number;
  yearBuilt?: number;
  homeType?: string;
  homeStatus?: string;
  price?: number;
  zestimate?: number;
  rentZestimate?: number;
  taxAssessedValue?: number;
  taxAnnualAmount?: number;
  thumb?: Array<{ url?: string }>;
  hiResImageLink?: string;
  lastSoldPrice?: number;
  description?: string;
  pageViewCount?: number;
  favoriteCount?: number;
}

export interface FormattedZillowData {
  id: string | null;
  zpid: number | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  living_area: number | null;
  lot_size: number | null;
  year_built: number | null;
  home_type: string | null;
  home_status: string | null;
  price: number | null;
  zestimate: number | null;
  rent_zestimate: number | null;
  tax_assessed_value: number | null;
  tax_annual_amount: number | null;
  favorite_count: number;
  page_view_count: number;
  description: string | null;
  image_url: string | null;
  school_summary: string;
  last_sold_date: string | null;
  last_sold_price: number | null;
  price_history: Array<{ date: string | null; event: string | null; price: number | null }>;
  tax_history: Array<{ year: number | null; value: number | null; taxPaid: number | null }>;
  created_at: Date;
}

export function formatZillowResponse(raw: RawZillowResponse): FormattedZillowData {
  const address = raw.address || {};
  const reso = raw.resoFacts || {};
  
  const schools = (raw.schools || [])
    .map((s: RawZillowSchool) => `${s.name || 'Unknown'} (${s.rating ?? "NA"}/10)`)
    .join(", ");

  const taxHistory = (raw.taxHistory || [])
    .slice(-5)
    .map((t: RawZillowTaxEntry) => {
      let year: number | null = null;
      if (t.time) {
        try {
          const date = new Date(t.time);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear();
          }
        } catch {
          year = null;
        }
      }
      return {
        year,
        value: t.value ?? null,
        taxPaid: t.taxPaid ?? null
      };
    })
    .filter((t) => t.year !== null || t.value !== null || t.taxPaid !== null);

  const priceHistory = (raw.priceHistory || [])
    .slice(-5)
    .map((p: RawZillowPriceEntry) => ({
      date: p.date ?? null,
      event: p.event ?? null,
      price: p.price ?? null
    }))
    .filter((p) => p.date !== null || p.event !== null || p.price !== null);

  return {
    id: raw.id ?? null,
    zpid: raw.zpid ?? null,
    street_address: address.streetAddress ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    zipcode: address.zipcode ?? null,
    county: raw.county ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    bedrooms: raw.bedrooms ?? reso.bedrooms ?? null,
    bathrooms: raw.bathrooms ?? reso.bathrooms ?? null,
    lot_size: raw.lotSize ?? reso.lotSize ?? null,
    living_area: raw.livingArea ?? reso.livingArea ?? null,
    year_built: raw.yearBuilt ?? reso.yearBuilt ?? null,
    home_type: raw.homeType ?? reso.homeType ?? null,
    home_status: raw.homeStatus ?? null,
    price: raw.price ?? null,
    zestimate: raw.zestimate ?? null,
    rent_zestimate: raw.rentZestimate ?? null,
    tax_assessed_value: reso.taxAssessedValue ?? null,
    tax_annual_amount: reso.taxAnnualAmount ?? null,
    image_url: raw.thumb?.[0]?.url ?? raw.hiResImageLink ?? null,
    school_summary: schools,
    last_sold_price: raw.lastSoldPrice ?? null,
    last_sold_date: raw.priceHistory?.[0]?.date ?? null,
    price_history: priceHistory,
    tax_history: taxHistory,
    description: raw.description ?? null,
    page_view_count: raw.pageViewCount ?? 0,
    favorite_count: raw.favoriteCount ?? 0,
    created_at: new Date()
  };
}

