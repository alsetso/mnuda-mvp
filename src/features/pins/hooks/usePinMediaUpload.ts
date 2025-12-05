'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PinMedia } from '@/features/pins/services/pinService';
import { useAuth } from '@/features/auth';

interface UsePinMediaUploadOptions {
  pinId?: string; // Required for uploads (pin must exist first)
  maxFiles?: number;
  maxFileSize?: number; // in bytes, default 100MB
}

export function usePinMediaUpload(options: UsePinMediaUploadOptions = {}) {
  const { user } = useAuth();
  const { maxFiles = 10, maxFileSize = 100 * 1024 * 1024 } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadMedia = useCallback(
    async (files: File[]): Promise<PinMedia[]> => {
      if (!user) {
        throw new Error('You must be logged in to upload media');
      }

      if (!options.pinId) {
        throw new Error('Pin ID is required for media upload');
      }

      if (files.length === 0) {
        return [];
      }

      if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      try {
        const uploadedMedia: PinMedia[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(((i + 1) / files.length) * 100);

          // Validate file type
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');

          if (!isImage && !isVideo) {
            throw new Error(`${file.name} is not a valid image or video file`);
          }

          // Validate file size
          if (file.size > maxFileSize) {
            throw new Error(`${file.name} exceeds maximum file size of ${Math.round(maxFileSize / 1024 / 1024)}MB`);
          }

          // Generate unique filename
          const fileExt = file.name.split('.').pop();
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(7);
          const fileName = `${user.id}/pins/${options.pinId}/${timestamp}-${random}.${fileExt}`;

          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pins-media')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('pins-media')
            .getPublicUrl(fileName);

          if (!urlData?.publicUrl) {
            throw new Error(`Failed to get URL for ${file.name}`);
          }

          // Create media object
          const mediaType: 'image' | 'video' = isImage ? 'image' : 'video';
          const mediaObject: PinMedia = {
            type: mediaType,
            url: urlData.publicUrl,
            filename: file.name,
            mime_type: file.type,
            size: file.size,
            uploaded_at: new Date().toISOString(),
            order: i,
          };

          // For images, try to get dimensions
          if (isImage) {
            try {
              const dimensions = await getImageDimensions(file);
              mediaObject.width = dimensions.width;
              mediaObject.height = dimensions.height;
            } catch (err) {
              console.warn('Failed to get image dimensions:', err);
            }
          }

          // For videos, duration would need to be extracted server-side or via client library
          // For now, we'll skip it and it can be added later if needed

          uploadedMedia.push(mediaObject);
        }

        setUploadProgress(100);
        return uploadedMedia;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload media';
        setUploadError(errorMessage);
        throw error;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user, options.pinId, maxFiles, maxFileSize]
  );

  const deleteMedia = useCallback(
    async (media: PinMedia): Promise<void> => {
      if (!user) {
        throw new Error('You must be logged in to delete media');
      }

      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/pins-media/{path}
      const urlParts = media.url.split('/pins-media/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid media URL');
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage.from('pins-media').remove([filePath]);

      if (error) {
        throw new Error(`Failed to delete media: ${error.message}`);
      }
    },
    [user]
  );

  return {
    uploadMedia,
    deleteMedia,
    isUploading,
    uploadError,
    uploadProgress,
  };
}

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}







