'use client';

import { supabase } from '@/lib/supabase';

export type SkipTraceApiType = 'name' | 'address' | 'phone' | 'email';

export interface SkipTraceResult {
  id: string;
  user_id: string;
  api_type: SkipTraceApiType;
  search_query: string;
  developer_data: Record<string, unknown> | null;
  raw_response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SkipTraceSearchParams {
  name?: string;
  address?: {
    street: string;
    citystatezip: string;
  };
  phone?: string;
  email?: string;
}

export class SkipTraceService {
  private static readonly RAPIDAPI_HOST = 'skip-tracing-working-api.p.rapidapi.com';
  
  private static getRapidApiKey(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use public env var
      return process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';
    }
    // Server-side: also use public env var (since it's already public)
    return process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';
  }

  /**
   * Search by name
   */
  static async searchByName(name: string): Promise<Record<string, unknown>> {
    const encodedName = encodeURIComponent(name);
    const url = `https://${this.RAPIDAPI_HOST}/search/byname?name=${encodedName}&page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': this.RAPIDAPI_HOST,
        'x-rapidapi-key': this.getRapidApiKey(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const errorMessage = `Name Search API error: ${response.status} - ${errorText}`;
      
      // Check if it's a subscription error
      if (response.status === 403 || errorText.toLowerCase().includes('not subscribed')) {
        const subscriptionError = new Error(errorMessage);
        (subscriptionError as { isSubscriptionError?: boolean }).isSubscriptionError = true;
        throw subscriptionError;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Search by address
   */
  static async searchByAddress(street: string, citystatezip: string): Promise<Record<string, unknown>> {
    const encodedStreet = encodeURIComponent(street);
    const encodedCityStateZip = encodeURIComponent(citystatezip);
    const url = `https://${this.RAPIDAPI_HOST}/search/byaddress?street=${encodedStreet}&citystatezip=${encodedCityStateZip}&page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': this.RAPIDAPI_HOST,
        'x-rapidapi-key': this.getRapidApiKey(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const errorMessage = `Address Search API error: ${response.status} - ${errorText}`;
      
      // Check if it's a subscription error
      if (response.status === 403 || errorText.toLowerCase().includes('not subscribed')) {
        const subscriptionError = new Error(errorMessage);
        (subscriptionError as { isSubscriptionError?: boolean }).isSubscriptionError = true;
        throw subscriptionError;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Search by phone
   */
  static async searchByPhone(phone: string): Promise<Record<string, unknown>> {
    const encodedPhone = encodeURIComponent(phone);
    const url = `https://${this.RAPIDAPI_HOST}/search/byphone?phoneno=${encodedPhone}&page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': this.RAPIDAPI_HOST,
        'x-rapidapi-key': this.getRapidApiKey(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const errorMessage = `Phone Search API error: ${response.status} - ${errorText}`;
      
      // Check if it's a subscription error
      if (response.status === 403 || errorText.toLowerCase().includes('not subscribed')) {
        const subscriptionError = new Error(errorMessage);
        (subscriptionError as { isSubscriptionError?: boolean }).isSubscriptionError = true;
        throw subscriptionError;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Search by email
   */
  static async searchByEmail(email: string): Promise<Record<string, unknown>> {
    const encodedEmail = encodeURIComponent(email);
    const url = `https://${this.RAPIDAPI_HOST}/search/byemail?email=${encodedEmail}&phone=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': this.RAPIDAPI_HOST,
        'x-rapidapi-key': this.getRapidApiKey(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const errorMessage = `Email Search API error: ${response.status} - ${errorText}`;
      
      // Check if it's a subscription error
      if (response.status === 403 || errorText.toLowerCase().includes('not subscribed')) {
        const subscriptionError = new Error(errorMessage);
        (subscriptionError as { isSubscriptionError?: boolean }).isSubscriptionError = true;
        throw subscriptionError;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Check if error is a subscription/API access error
   */
  static isSubscriptionError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('not subscribed') ||
        message.includes('403') ||
        message.includes('subscription') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')
      );
    }
    return false;
  }

  /**
   * Execute skip trace search and save to database
   */
  static async executeSkipTrace(
    apiType: SkipTraceApiType,
    searchQuery: string,
    params: SkipTraceSearchParams
  ): Promise<SkipTraceResult> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User must be authenticated to perform skip trace searches');
    }

    // Call appropriate API
    let rawResponse: Record<string, unknown>;
    try {
      switch (apiType) {
        case 'name':
          if (!params.name) throw new Error('Name parameter is required');
          rawResponse = await this.searchByName(params.name);
          break;
        case 'address':
          if (!params.address) throw new Error('Address parameters are required');
          rawResponse = await this.searchByAddress(params.address.street, params.address.citystatezip);
          break;
        case 'phone':
          if (!params.phone) throw new Error('Phone parameter is required');
          rawResponse = await this.searchByPhone(params.phone);
          break;
        case 'email':
          if (!params.email) throw new Error('Email parameter is required');
          rawResponse = await this.searchByEmail(params.email);
          break;
        default:
          throw new Error(`Unknown API type: ${apiType}`);
      }
    } catch (apiError) {
      // Check if it's a subscription error and rethrow with a flag
      if (this.isSubscriptionError(apiError)) {
        const subscriptionError = new Error('API subscription required');
        (subscriptionError as { isSubscriptionError?: boolean }).isSubscriptionError = true;
        throw subscriptionError;
      }
      throw apiError;
    }

    // Parse developer data from response (structured data)
    const developerData = this.parseDeveloperData(rawResponse);

    // Save to database only if API call succeeded
    const { data, error } = await supabase
      .from('skip_tracing')
      .insert({
        user_id: user.id,
        api_type: apiType,
        search_query: searchQuery,
        developer_data: developerData,
        raw_response: rawResponse,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving skip trace result:', error);
      throw new Error(`Failed to save skip trace result: ${error.message}`);
    }

    return data as SkipTraceResult;
  }

  /**
   * Parse structured developer data from raw API response
   */
  private static parseDeveloperData(rawResponse: Record<string, unknown>): Record<string, unknown> | null {
    try {
      // Extract structured data from response
      // This parses common fields that developers would want to use
      const parsed: Record<string, unknown> = {};

      // Extract person details if present
      if (rawResponse['Person Details'] || rawResponse.personDetails) {
        parsed.personDetails = rawResponse['Person Details'] || rawResponse.personDetails;
      }

      // Extract emails if present
      if (rawResponse['Email Addresses'] || rawResponse.emails || rawResponse.EmailAddresses) {
        parsed.emails = rawResponse['Email Addresses'] || rawResponse.emails || rawResponse.EmailAddresses;
      }

      // Extract phones if present
      if (rawResponse['All Phone Details'] || rawResponse.phones || rawResponse.AllPhoneDetails) {
        parsed.phones = rawResponse['All Phone Details'] || rawResponse.phones || rawResponse.AllPhoneDetails;
      }

      // Extract addresses if present
      if (rawResponse['Current Address Details List'] || rawResponse.currentAddresses || rawResponse.CurrentAddressDetailsList) {
        parsed.currentAddresses = rawResponse['Current Address Details List'] || rawResponse.currentAddresses || rawResponse.CurrentAddressDetailsList;
      }

      if (rawResponse['Previous Address Details'] || rawResponse.previousAddresses || rawResponse.PreviousAddressDetails) {
        parsed.previousAddresses = rawResponse['Previous Address Details'] || rawResponse.previousAddresses || rawResponse.PreviousAddressDetails;
      }

      // Extract relatives if present
      if (rawResponse['All Relatives'] || rawResponse.relatives || rawResponse.AllRelatives) {
        parsed.relatives = rawResponse['All Relatives'] || rawResponse.relatives || rawResponse.AllRelatives;
      }

      // Extract associates if present
      if (rawResponse['All Associates'] || rawResponse.associates || rawResponse.AllAssociates) {
        parsed.associates = rawResponse['All Associates'] || rawResponse.associates || rawResponse.AllAssociates;
      }

      // Extract status and message if present
      if (rawResponse.status !== undefined) {
        parsed.status = rawResponse.status;
      }
      if (rawResponse.message !== undefined || rawResponse.Message !== undefined) {
        parsed.message = rawResponse.message || rawResponse.Message;
      }

      // If response has a data array, include it
      if (Array.isArray(rawResponse.data)) {
        parsed.data = rawResponse.data;
      }

      // If response has results array, include it
      if (Array.isArray(rawResponse.results)) {
        parsed.results = rawResponse.results;
      }

      return Object.keys(parsed).length > 0 ? parsed : null;
    } catch (error) {
      console.error('Error parsing developer data:', error);
      return null;
    }
  }

  /**
   * Get skip trace results for current user
   */
  static async getUserSkipTraces(limit: number = 50): Promise<SkipTraceResult[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User must be authenticated to view skip trace results');
    }

    const { data, error } = await supabase
      .from('skip_tracing')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch skip trace results: ${error.message}`);
    }

    return (data || []) as SkipTraceResult[];
  }

  /**
   * Get a single skip trace result by ID
   */
  static async getSkipTraceById(id: string): Promise<SkipTraceResult | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User must be authenticated to view skip trace results');
    }

    const { data, error } = await supabase
      .from('skip_tracing')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch skip trace result: ${error.message}`);
    }

    return data as SkipTraceResult;
  }

  /**
   * Delete a skip trace result
   */
  static async deleteSkipTrace(id: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User must be authenticated to delete skip trace results');
    }

    const { error } = await supabase
      .from('skip_tracing')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete skip trace result: ${error.message}`);
    }
  }
}

