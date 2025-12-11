/**
 * useMediaUpload Hook
 * Manages media selection, preview, and upload state
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { MediaUploadService } from '../services/mediaUploadService';
import type { MediaPreview, UploadedMedia, MediaUploadOptions } from '../types';

export interface UseMediaUploadOptions {
  initialFiles?: File[];
  initialPreviews?: MediaPreview[];
  onUploadComplete?: (media: UploadedMedia[]) => void;
  onMediaReady?: (previews: MediaPreview[], files: File[]) => void;
}

export interface UseMediaUploadReturn {
  files: File[];
  previews: MediaPreview[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  stage: 'select' | 'preview' | 'uploading' | 'complete';
  
  // Actions
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (index: number) => void;
  upload: (options: MediaUploadOptions) => Promise<UploadedMedia[]>;
  reset: () => void;
  clearError: () => void;
}

export function useMediaUpload(
  options: UseMediaUploadOptions = {}
): UseMediaUploadReturn {
  const {
    initialFiles = [],
    initialPreviews = [],
    onUploadComplete,
    onMediaReady,
  } = options;

  const [files, setFiles] = useState<File[]>(initialFiles);
  const [previews, setPreviews] = useState<MediaPreview[]>(initialPreviews);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'select' | 'preview' | 'uploading' | 'complete'>(
    initialFiles.length > 0 ? 'preview' : 'select'
  );

  const previewsRef = useRef<MediaPreview[]>(previews);

  // Keep ref in sync
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Initialize from props
  useEffect(() => {
    if (initialFiles.length > 0) {
      setFiles(initialFiles);
      if (initialPreviews.length > 0 && initialPreviews.length === initialFiles.length) {
        setPreviews(initialPreviews);
      } else {
        // Recreate previews from files
        MediaUploadService.createPreviews(initialFiles).then(setPreviews);
      }
      setStage('preview');
    }
  }, [initialFiles, initialPreviews]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      MediaUploadService.revokeBlobUrls(previewsRef.current);
    };
  }, []);

  const addFiles = useCallback(async (newFiles: File[]) => {
    try {
      setError(null);
      
      // Validate files
      for (const file of newFiles) {
        const validation = MediaUploadService.validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
      
      // Create previews
      const newPreviews = await MediaUploadService.createPreviews(newFiles);
      setPreviews((prev) => [...prev, ...newPreviews]);
      setStage('preview');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add files';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setPreviews((prev) => {
      const previewToRemove = prev[index];
      if (previewToRemove?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(previewToRemove.url);
      }
      const newPreviews = prev.filter((_, i) => i !== index);
      if (newPreviews.length === 0) {
        setStage('select');
      }
      return newPreviews;
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const upload = useCallback(
    async (uploadOptions: MediaUploadOptions): Promise<UploadedMedia[]> => {
      if (files.length === 0) {
        throw new Error('No files to upload');
      }

      setIsUploading(true);
      setStage('uploading');
      setError(null);
      setUploadProgress(0);

      try {
        const uploaded = await MediaUploadService.uploadMedia(files, {
          ...uploadOptions,
          onProgress: (progress) => {
            setUploadProgress(progress);
            uploadOptions.onProgress?.(progress);
          },
        });

        setStage('complete');
        setUploadProgress(100);
        onUploadComplete?.(uploaded);
        return uploaded;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload media';
        setError(errorMessage);
        setStage('preview');
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [files, onUploadComplete]
  );

  const reset = useCallback(() => {
    MediaUploadService.revokeBlobUrls(previewsRef.current);
    setFiles([]);
    setPreviews([]);
    setStage('select');
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);


  return {
    files,
    previews,
    isUploading,
    uploadProgress,
    error,
    stage,
    addFiles,
    removeFile,
    upload,
    reset,
    clearError,
  };
}


