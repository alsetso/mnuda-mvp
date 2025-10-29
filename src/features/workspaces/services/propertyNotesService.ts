import { supabase } from '@/lib/supabase';

export interface PropertyNote {
  id: string;
  property_id: string;
  profile_id: string;
  workspace_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface CreatePropertyNoteData {
  property_id: string;
  workspace_id: string;
  comment: string;
}

export interface UpdatePropertyNoteData {
  comment: string;
}

class PropertyNotesService {
  async getPropertyNotes(propertyId: string): Promise<PropertyNote[]> {
    const { data, error } = await supabase
      .from('property_notes')
      .select(`
        *,
        profile:profiles(id, email, full_name)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property notes:', error);
      throw new Error('Failed to fetch property notes');
    }

    return (data || []) as PropertyNote[];
  }

  async createPropertyNote(noteData: CreatePropertyNoteData): Promise<PropertyNote> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create notes');
    }

    const { data, error } = await supabase
      .from('property_notes')
      .insert({
        ...noteData,
        profile_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property note:', error);
      throw new Error('Failed to create property note');
    }

    return data;
  }

  async updatePropertyNote(id: string, noteData: UpdatePropertyNoteData): Promise<PropertyNote> {
    const { data, error } = await supabase
      .from('property_notes')
      .update(noteData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property note:', error);
      throw new Error('Failed to update property note');
    }

    return data;
  }

  async deletePropertyNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('property_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property note:', error);
      throw new Error('Failed to delete property note');
    }
  }
}

export const propertyNotesService = new PropertyNotesService();

