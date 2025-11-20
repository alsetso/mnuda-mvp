'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ProfileService, Profile } from '@/features/profiles/services/profileService';
import { Account, AccountService } from '@/features/auth';

interface ProfilePhotoProps {
  profile?: Profile | null;
  account?: Account | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onUpdate?: (updatedProfile: Profile) => void;
  className?: string;
}

export default function ProfilePhoto({ 
  profile,
  account,
  size = 'md', 
  editable = false, 
  onUpdate,
  className = '' 
}: ProfilePhotoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const avatarUrl = profile?.profile_image || account?.image_url || null;
  const displayName = profile ? ProfileService.getDisplayName(profile) : AccountService.getDisplayName(account) || '';
  const email = account?.user_id || '';

  const getInitials = (): string => {
    if (displayName) {
      const names = displayName.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getBackgroundColor = (): string => {
    if (avatarUrl) return '';
    
    // Generate a consistent color based on profile ID or account email
    const seed = profile?.id || account?.id || email || 'default';
    const colors = [
      'bg-gold-500',
      'bg-green-500', 
      'bg-gray-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-stone-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Convert file to base64 for now (in production, you'd upload to a storage service)
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          if (!profile) {
            setUploadError('No profile selected');
            return;
          }
          
          // Update profile with new image URL
          const updatedProfile = await ProfileService.updateProfile(profile.id, {
            profile_image: base64Data,
          });

          if (updatedProfile && onUpdate) {
            onUpdate(updatedProfile);
          }
        } catch (error) {
          console.error('Error updating avatar:', error);
          setUploadError('Failed to update profile photo');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setUploadError('Failed to process image');
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;
    
    setIsUploading(true);
    setUploadError('');

    try {
      const updatedProfile = await ProfileService.updateProfile(profile.id, {
        profile_image: null,
      });

      if (updatedProfile && onUpdate) {
        onUpdate(updatedProfile);
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      setUploadError('Failed to remove profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Profile Photo */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${getBackgroundColor()} text-white font-medium border-2 border-gray-300 relative`}>
        {avatarUrl && !imageError ? (
          <Image
            src={avatarUrl}
            alt={displayName || email}
            fill
            sizes="(max-width: 96px) 100vw, 96px"
            className="object-cover rounded-full"
            onError={() => setImageError(true)}
            unoptimized={avatarUrl.startsWith('data:') || avatarUrl.includes('supabase.co')}
          />
        ) : (
          <span className={`${iconSizes[size]} font-semibold`}>
            {getInitials()}
          </span>
        )}
      </div>

      {/* Upload Overlay */}
      {editable && (
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center group cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Remove Photo Button */}
      {editable && avatarUrl && (
        <button
          onClick={handleRemovePhoto}
          disabled={isUploading}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-50"
          title="Remove photo"
        >
          ×
        </button>
      )}

      {/* Hidden File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="absolute top-full left-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs whitespace-nowrap z-10">
          {uploadError}
        </div>
      )}
    </div>
  );
}
