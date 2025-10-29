import { supabase } from '@/lib/supabase';

export interface Property {
  id: string;
  workspace_id: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  status: 'Preforeclosure' | 'Foreclosure' | 'Foreclosed' | 'Auction' | 'Redemption' | 'Bank Owned' | 'Short Sale' | 'Subject To' | 'Deed In Lieu' | 'Leaseback' | 'For Sale By Owner' | 'Listed On MLS' | 'Under Contract' | 'Sold' | 'Off Market';
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyData {
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  status?: Property['status'];
}

export interface UpdatePropertyData {
  full_address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  status?: Property['status'];
}

class PropertiesService {
  async getProperties(workspaceId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw new Error('Failed to fetch properties');
    }

    return data || [];
  }

  async getProperty(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      throw new Error('Failed to fetch property');
    }

    return data;
  }

  async createProperty(workspaceId: string, propertyData: CreatePropertyData): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        workspace_id: workspaceId,
        ...propertyData,
        status: propertyData.status || 'Off Market'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      throw new Error('Failed to create property');
    }

    return data;
  }

  async updateProperty(id: string, propertyData: UpdatePropertyData): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      throw new Error('Failed to update property');
    }

    return data;
  }

  async deleteProperty(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      throw new Error('Failed to delete property');
    }
  }

  async searchProperties(workspaceId: string, query: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('workspace_id', workspaceId)
      .or(`full_address.ilike.%${query}%,street_address.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,zipcode.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching properties:', error);
      throw new Error('Failed to search properties');
    }

    return data || [];
  }
}

export const propertiesService = new PropertiesService();
