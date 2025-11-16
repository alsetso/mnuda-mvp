'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useListing } from '@/features/marketplace/hooks/useListing';
import { ListingService } from '@/features/marketplace/services/listingService';
import { PinService, type Pin } from '@/features/pins/services/pinService';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import type { UpdateListingData } from '@/features/marketplace/types';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user } = useAuth();
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidId = listingId && uuidRegex.test(listingId);
  
  const { listing, isLoading, refreshListing } = useListing(listingId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState<'physical' | 'digital'>('physical');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pinId, setPinId] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'sold' | 'expired' | 'draft'>('active');
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // Load user's pins
  useEffect(() => {
    if (user) {
      loadUserPins();
    }
  }, [user]);

  const loadUserPins = async () => {
    setIsLoadingPins(true);
    try {
      const userPins = await PinService.getUserPins();
      setPins(userPins);
    } catch (err) {
      console.error('Error loading pins:', err);
    } finally {
      setIsLoadingPins(false);
    }
  };

  // Initialize form when listing loads
  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description || '');
      setListingType(listing.listing_type);
      setPrice(listing.is_free ? '' : listing.price.toString());
      setIsFree(listing.is_free);
      setImageUrls(listing.image_urls || []);
      setPinId(listing.pin_id || null);
      setStatus(listing.status);
    }
  }, [listing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Listing title is required');
      return;
    }

    if (title.length < 3 || title.length > 200) {
      setError('Listing title must be between 3 and 200 characters');
      return;
    }

    if (description.length > 2000) {
      setError('Description cannot exceed 2000 characters');
      return;
    }

    const priceValue = parseFloat(price);
    if (!isFree && (isNaN(priceValue) || priceValue < 0)) {
      setError('Please enter a valid price');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: UpdateListingData = {
        title: title.trim(),
        description: description.trim() || null,
        listing_type: listingType,
        price: isFree ? 0 : priceValue,
        is_free: isFree,
        image_urls: imageUrls.length > 0 ? imageUrls : [],
        pin_id: pinId || null,
        status: status,
      };

      await ListingService.updateListing(listingId, updateData);
      success('Listing Updated', 'Your listing has been updated!');
      await refreshListing();
      router.push(`/market/${listingId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update listing';
      setError(errorMessage);
      showError('Failed to Update Listing', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to edit listings.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isValidId) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Invalid Listing ID</p>
            <p className="text-gray-400">The listing ID in the URL is not valid.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!listing) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Listing not found.</p>
            <p className="text-gray-400">The listing you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!listing.current_user_is_owner) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Access Denied</p>
            <p className="text-gray-400 mb-4">Only listing owners can edit listings.</p>
            <button
              onClick={() => router.push(`/market/${listing.id}`)}
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
            >
              Back to Listing
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      showHeader={true} 
      showFooter={false} 
      containerMaxWidth="full" 
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-200 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/market/${listing.id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to listing"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black">Edit Listing</h1>
                <p className="text-sm text-gray-500 mt-1">{listing.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter listing title"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  disabled={isSaving}
                  required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 2000) {
                      setDescription(value);
                    }
                  }}
                  placeholder="Describe your listing..."
                  rows={6}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                  disabled={isSaving}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/2000 characters
                </p>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType('physical')}
                    disabled={isSaving}
                    className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors ${
                      listingType === 'physical'
                        ? 'bg-gold-500 text-black'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Physical
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('digital')}
                    disabled={isSaving}
                    className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors ${
                      listingType === 'digital'
                        ? 'bg-gold-500 text-black'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Digital
                  </button>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Price
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => {
                        setIsFree(e.target.checked);
                        if (e.target.checked) {
                          setPrice('');
                        }
                      }}
                      disabled={isSaving}
                      className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                    />
                    <span className="text-sm text-gray-700">Free</span>
                  </label>
                  {!isFree && (
                    <div className="flex-1">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                            setPrice(value);
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        disabled={isSaving}
                        required={!isFree}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              <ImageUpload
                value={imageUrls}
                onChange={(urls) => setImageUrls(Array.isArray(urls) ? urls : [])}
                bucket="marketplace-images"
                table="marketplace_listings"
                column="image_urls"
                multiple={true}
                maxImages={10}
                label="Images (optional)"
                disabled={isSaving}
              />

              {/* Pin Selection */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Connect to Pin (optional)
                </label>
                {isLoadingPins ? (
                  <div className="text-sm text-gray-500">Loading pins...</div>
                ) : (
                  <select
                    value={pinId || ''}
                    onChange={(e) => setPinId(e.target.value || null)}
                    disabled={isSaving}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">No pin selected</option>
                    {pins.map((pin) => (
                      <option key={pin.id} value={pin.id}>
                        {pin.emoji} {pin.name} - {pin.address}
                      </option>
                    ))}
                  </select>
                )}
                {pins.length === 0 && !isLoadingPins && (
                  <p className="text-xs text-gray-500 mt-1">
                    Create a pin on the community map to connect it to your listing
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'sold' | 'expired' | 'draft')}
                  disabled={isSaving}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="expired">Expired</option>
                  <option value="draft">Draft</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only active listings are visible to other users
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push(`/market/${listing.id}`)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

