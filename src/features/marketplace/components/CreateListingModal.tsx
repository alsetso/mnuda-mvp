'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PinService, type Pin } from '@/features/pins/services/pinService';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import type { CreateListingData, MarketplaceListing } from '../types';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateListing: (data: CreateListingData) => Promise<MarketplaceListing>;
}

export function CreateListingModal({ isOpen, onClose, onCreateListing }: CreateListingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState<'physical' | 'digital'>('physical');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pinId, setPinId] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's pins when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserPins();
    }
  }, [isOpen]);

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

    setIsCreating(true);
    setError(null);

    try {
      await onCreateListing({
        title: title.trim(),
        description: description.trim() || null,
        listing_type: listingType,
        price: isFree ? 0 : priceValue,
        is_free: isFree,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        pin_id: pinId || null,
        status: 'active',
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setListingType('physical');
      setPrice('');
      setIsFree(false);
      setImageUrls([]);
      setPinId(null);
      setError(null);
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setTitle('');
    setDescription('');
    setListingType('physical');
    setPrice('');
    setIsFree(false);
    setImageUrls([]);
    setPinId(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 p-6 pb-0">
            <h2 className="text-2xl font-bold text-black">Create Listing</h2>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

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
                disabled={isCreating}
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
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                disabled={isCreating}
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
                  disabled={isCreating}
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
                  disabled={isCreating}
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
                    disabled={isCreating}
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
                      disabled={isCreating}
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
              disabled={isCreating}
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
                  disabled={isCreating}
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

