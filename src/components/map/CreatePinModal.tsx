'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PhotoIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { PublicMapPinService } from '@/features/map-pins/services/publicMapPinService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import type { CreateMapPinData } from '@/types/map-pin';

interface CreatePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: { lat: number; lng: number } | null;
  onPinCreated: () => void;
}

const DEFAULT_PIN_COLOR = '#3b82f6'; // Blue

export default function CreatePinModal({
  isOpen,
  onClose,
  coordinates,
  onPinCreated,
}: CreatePinModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setDescription('');
      setSelectedFile(null);
      setFilePreview(null);
      setError(null);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please select a valid image or video file');
      return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File must be smaller than 100MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For videos, create object URL for preview
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    if (filePreview && selectedFile?.type.startsWith('video/')) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview && selectedFile?.type.startsWith('video/')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview, selectedFile]);

  if (!isOpen || !coordinates) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!label.trim()) {
      setError('Label is required');
      return;
    }

    if (!user) {
      setError('You must be logged in to create pins');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        
        // Generate unique filename
        const fileExt = selectedFile.name.split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/map-pins/${timestamp}-${random}.${fileExt}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('map-pins-media')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('map-pins-media')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get file URL');
        }

        mediaUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      // Create pin with media URL and default color
      const pinData: CreateMapPinData = {
        lat: coordinates.lat,
        lng: coordinates.lng,
        label: label.trim(),
        description: description.trim() || null,
        color: DEFAULT_PIN_COLOR,
        media_url: mediaUrl,
      };

      await PublicMapPinService.createPin(pinData);
      onPinCreated();
      onClose();
    } catch (err) {
      console.error('Error creating pin:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pin');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-white border border-gray-200 rounded-md shadow-lg">
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-[10px] border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Create Pin</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-0.5"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form - Compact spacing */}
        <form onSubmit={handleSubmit} className="p-[10px] space-y-3">
          {/* Coordinates display - Minimal */}
          <div className="text-xs text-gray-500">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </div>

          {/* Label */}
          <div className="space-y-0.5">
            <label htmlFor="label" className="block text-xs font-medium text-gray-900">
              Label <span className="text-gray-500">*</span>
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              placeholder="Enter pin label"
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-0.5">
            <label htmlFor="description" className="block text-xs font-medium text-gray-900">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none"
              placeholder="Optional description"
              rows={2}
              disabled={isSubmitting || isUploading}
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-0.5">
            <label className="block text-xs font-medium text-gray-900">
              Photo or Video
            </label>
            {!selectedFile ? (
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting || isUploading}
                />
                <div className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-1.5">
                  <PhotoIcon className="w-3.5 h-3.5" />
                  <span>Choose file (optional)</span>
                </div>
              </label>
            ) : (
              <div className="relative">
                {filePreview && (
                  <div className="relative w-full rounded-md overflow-hidden border border-gray-200">
                    {selectedFile.type.startsWith('image/') ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <video
                        src={filePreview}
                        className="w-full h-32 object-cover"
                        controls={false}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-1 right-1 p-0.5 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                      disabled={isSubmitting || isUploading}
                    >
                      <XCircleIcon className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {selectedFile.name}
                </div>
              </div>
            )}
          </div>

          {/* Error message - Compact */}
          {error && (
            <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 p-1.5 rounded">
              {error}
            </div>
          )}

          {/* Actions - Compact */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !label.trim()}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
