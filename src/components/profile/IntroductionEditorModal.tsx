'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { AccountService, Account, AccountTrait } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import AccountTraits from './AccountTraits';

interface City {
  id: string;
  name: string;
}

interface IntroductionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccount: Account;
  onSave: (updatedAccount: Account) => void;
}

export default function IntroductionEditorModal({
  isOpen,
  onClose,
  initialAccount,
  onSave,
}: IntroductionEditorModalProps) {
  const [formData, setFormData] = useState({
    first_name: initialAccount.first_name || '',
    last_name: initialAccount.last_name || '',
    gender: initialAccount.gender || '',
    bio: initialAccount.bio || '',
    city_id: initialAccount.city_id || null,
    image_url: initialAccount.image_url || null,
    cover_image_url: initialAccount.cover_image_url || null,
    traits: initialAccount.traits || [],
  });
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: initialAccount.first_name || '',
        last_name: initialAccount.last_name || '',
        gender: initialAccount.gender || '',
        bio: initialAccount.bio || '',
        city_id: initialAccount.city_id || null,
        image_url: initialAccount.image_url || null,
        cover_image_url: initialAccount.cover_image_url || null,
        traits: initialAccount.traits || [],
      });
      setCitySearchQuery('');
      setError(null);
      loadCities();
      if (initialAccount.city_id) {
        fetchCityName(initialAccount.city_id);
      } else {
        setSelectedCityName(null);
      }
    }
  }, [isOpen, initialAccount]);

  // Filter cities based on search query
  useEffect(() => {
    if (citySearchQuery.trim() === '') {
      setFilteredCities(cities.slice(0, 50));
    } else {
      const query = citySearchQuery.toLowerCase();
      const filtered = cities
        .filter((city) => city.name.toLowerCase().includes(query))
        .slice(0, 50);
      setFilteredCities(filtered);
    }
  }, [citySearchQuery, cities]);

  const loadCities = async () => {
    setIsLoadingCities(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(1000);

      if (error) throw error;
      setCities(data || []);
      setFilteredCities((data || []).slice(0, 50));
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const fetchCityName = async (cityId: string) => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('name')
        .eq('id', cityId)
        .single();

      if (!error && data) {
        setSelectedCityName(data.name);
      }
    } catch (err) {
      console.error('Error fetching city name:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `${user.id}/accounts/profile/${timestamp}-${random}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsUploadingCoverImage(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `${user.id}/accounts/cover/${timestamp}-${random}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('cover-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('cover-photos')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setFormData(prev => ({ ...prev, cover_image_url: urlData.publicUrl }));
    } catch (err) {
      console.error('Error uploading cover image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload cover image');
    } finally {
      setIsUploadingCoverImage(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const updatedAccount = await AccountService.updateCurrentAccount({
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        gender: formData.gender || null,
        bio: formData.bio.trim() || null,
        city_id: formData.city_id,
        image_url: formData.image_url,
        cover_image_url: formData.cover_image_url,
        traits: formData.traits.length > 0 ? formData.traits : null,
      });

      onSave(updatedAccount);
      onClose();
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err instanceof Error ? err.message : 'Failed to update account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: initialAccount.first_name || '',
      last_name: initialAccount.last_name || '',
      gender: initialAccount.gender || '',
      bio: initialAccount.bio || '',
      city_id: initialAccount.city_id || null,
      image_url: initialAccount.image_url || null,
      cover_image_url: initialAccount.cover_image_url || null,
      traits: initialAccount.traits || [],
    });
    setCitySearchQuery('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const bioRemainingChars = 220 - formData.bio.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-md border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-[10px] border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Edit Introduction</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSaving}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-[10px] space-y-3">
          {/* Error Message */}
          {error && (
            <div className="p-[10px] bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
              {error}
            </div>
          )}

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Cover Photo
            </label>
            <div className="relative w-full h-32 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
              {formData.cover_image_url ? (
                <Image
                  src={formData.cover_image_url}
                  alt="Cover"
                  fill
                  className="object-cover"
                  unoptimized={formData.cover_image_url.includes('supabase.co')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  disabled={isUploadingCoverImage || isSaving}
                />
                <span className="px-3 py-1.5 bg-gray-100 hover:bg-gray-50 rounded-md text-xs font-medium text-gray-700 transition-colors inline-block">
                  {isUploadingCoverImage ? 'Uploading...' : formData.cover_image_url ? 'Change Cover' : 'Upload Cover'}
                </span>
              </label>
              {formData.cover_image_url && (
                <button
                  onClick={() => setFormData(prev => ({ ...prev, cover_image_url: null }))}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isSaving}
                >
                  Remove cover
                </button>
              )}
            </div>
          </div>

          {/* Profile Photo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Profile Photo
            </label>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {formData.image_url ? (
                  <Image
                    src={formData.image_url}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized={formData.image_url.includes('supabase.co')}
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage || isSaving}
                  />
                  <span className="px-3 py-1.5 bg-gray-100 hover:bg-gray-50 rounded-md text-xs font-medium text-gray-700 transition-colors inline-block">
                    {isUploadingImage ? 'Uploading...' : formData.image_url ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </label>
                {formData.image_url && (
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, image_url: null }))}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isSaving}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="first_name" className="block text-xs font-medium text-gray-700 mb-1.5">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-[10px] py-1.5 border border-gray-200 rounded-md focus:border-gray-500 focus:outline-none text-xs"
                disabled={isSaving}
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-xs font-medium text-gray-700 mb-1.5">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-[10px] py-1.5 border border-gray-200 rounded-md focus:border-gray-500 focus:outline-none text-xs"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-xs font-medium text-gray-700 mb-1.5">
              Gender
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-[10px] py-1.5 border border-gray-200 rounded-md focus:border-gray-500 focus:outline-none text-xs"
              disabled={isSaving}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-xs font-medium text-gray-700 mb-1.5">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              maxLength={220}
              rows={4}
              className="w-full px-[10px] py-1.5 border border-gray-200 rounded-md focus:border-gray-500 focus:outline-none resize-none text-xs"
              placeholder="Tell us about yourself..."
              disabled={isSaving}
            />
            <div className="mt-1.5 text-right text-xs text-gray-500">
              {bioRemainingChars} characters remaining
            </div>
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              City
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder={selectedCityName || "Search cities..."}
                className="w-full pl-8 pr-[10px] py-1.5 border border-gray-200 rounded-md focus:border-gray-500 focus:outline-none text-xs"
                disabled={isSaving || isLoadingCities}
              />
            </div>
            {citySearchQuery && (
              <div className="mt-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {isLoadingCities ? (
                  <div className="p-[10px] text-center text-xs text-gray-500">Loading cities...</div>
                ) : filteredCities.length === 0 ? (
                  <div className="p-[10px] text-center text-xs text-gray-500">No cities found</div>
                ) : (
                  <div className="p-1.5 space-y-0.5">
                    {filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, city_id: city.id }));
                          setSelectedCityName(city.name);
                          setCitySearchQuery('');
                        }}
                        disabled={isSaving}
                        className={`w-full text-left px-2 py-1.5 rounded-md transition-colors text-xs ${
                          formData.city_id === city.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-white hover:bg-gray-50 text-gray-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {formData.city_id && selectedCityName && (
              <div className="mt-1.5 flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-md">
                <span className="text-xs text-gray-700">{selectedCityName}</span>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, city_id: null }));
                    setSelectedCityName(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Traits */}
          <div>
            <AccountTraits
              traits={formData.traits}
              editable={true}
              maxTraits={3}
              onTraitToggle={(trait) => {
                setFormData(prev => {
                  const currentTraits = prev.traits || [];
                  const isSelected = currentTraits.includes(trait);
                  
                  // If deselecting, remove it
                  if (isSelected) {
                    return {
                      ...prev,
                      traits: currentTraits.filter(t => t !== trait),
                    };
                  }
                  
                  // If selecting and at limit, don't add
                  if (currentTraits.length >= 3) {
                    return prev;
                  }
                  
                  // Add trait
                  return {
                    ...prev,
                    traits: [...currentTraits, trait],
                  };
                });
              }}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              {formData.traits.length}/3 traits selected
              {formData.traits.length >= 3 && (
                <span className="text-gray-400 ml-1">(maximum reached)</span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-[10px] border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || isUploadingImage || isUploadingCoverImage}
              className="flex-1 px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

