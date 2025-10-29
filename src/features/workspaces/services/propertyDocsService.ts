import { supabase } from '@/lib/supabase';

export interface PropertyDoc {
  id: string;
  property_id: string;
  profile_id: string;
  workspace_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface CreatePropertyDocData {
  property_id: string;
  workspace_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  description?: string;
}

export interface UpdatePropertyDocData {
  file_name?: string;
  description?: string;
}

const STORAGE_BUCKET = 'property-docs';

class PropertyDocsService {
  async getPropertyDocs(propertyId: string): Promise<PropertyDoc[]> {
    const { data, error } = await supabase
      .from('property_docs')
      .select(`
        *,
        profile:profiles(id, email, full_name)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property docs:', error);
      throw new Error('Failed to fetch property docs');
    }

    return (data || []) as PropertyDoc[];
  }

  async uploadPropertyDoc(
    propertyId: string,
    workspaceId: string,
    file: File,
    description?: string
  ): Promise<PropertyDoc> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to upload docs');
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Generate unique file path: properties/{property_id}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `properties/${propertyId}/${timestamp}_${sanitizedFileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Create database record
    const { data: docData, error: docError } = await supabase
      .from('property_docs')
      .insert({
        property_id: propertyId,
        workspace_id: workspaceId,
        profile_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        description: description || null
      })
      .select(`
        *,
        profile:profiles(id, email, full_name)
      `)
      .single();

    if (docError) {
      // If database insert fails, try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      console.error('Error creating property doc record:', docError);
      throw new Error('Failed to create property doc record');
    }

    return docData as PropertyDoc;
  }

  async getDocDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating download URL:', error);
      throw new Error('Failed to create download URL');
    }

    return data.signedUrl;
  }

  async updatePropertyDoc(id: string, docData: UpdatePropertyDocData): Promise<PropertyDoc> {
    const { data, error } = await supabase
      .from('property_docs')
      .update(docData)
      .eq('id', id)
      .select(`
        *,
        profile:profiles(id, email, full_name)
      `)
      .single();

    if (error) {
      console.error('Error updating property doc:', error);
      throw new Error('Failed to update property doc');
    }

    return data as PropertyDoc;
  }

  async deletePropertyDoc(id: string, filePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue to delete DB record even if storage delete fails
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('property_docs')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting property doc record:', dbError);
      throw new Error('Failed to delete property doc record');
    }
  }
}

export const propertyDocsService = new PropertyDocsService();

