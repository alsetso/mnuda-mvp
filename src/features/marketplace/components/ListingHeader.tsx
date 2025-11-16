'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBagIcon, ShareIcon, PencilIcon, TrashIcon, MapPinIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DeleteModal } from '@/features/ui/components/DeleteModal';
import type { MarketplaceListing } from '../types';

interface ListingHeaderProps {
  listing: MarketplaceListing;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
}

export function ListingHeader({ listing, onDelete, isDeleting = false }: ListingHeaderProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const canEdit = listing.current_user_is_owner;
  const formatPrice = (price: number, isFree: boolean) => {
    if (isFree) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    try {
      await onDelete();
      router.push('/market');
    } catch (err) {
      console.error('Error deleting listing:', err);
      throw err; // Re-throw to let modal handle error state
    }
  };

  return (
    <div className="bg-white border-b-2 border-gray-200 w-full relative">
      {/* Cover Image */}
      {listing.image_urls && listing.image_urls.length > 0 && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={listing.image_urls[0]}
            alt={listing.title}
            className="w-full h-64 object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-white/80" />
        </div>
      )}
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Image/Icon - Larger, more prominent */}
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gold-100 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden ring-2 ring-white">
            {listing.image_urls && listing.image_urls.length > 0 ? (
              <img
                src={listing.image_urls[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingBagIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gold-600" />
            )}
          </div>

          {/* Content - Better spacing and hierarchy */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight flex-1">
                  {listing.title}
                </h1>
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 bg-gold-100 text-gold-700 text-sm font-semibold rounded-lg">
                    {listing.listing_type === 'physical' ? 'Physical' : 'Digital'}
                  </span>
                </div>
              </div>
              
              {listing.description && (
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-3">
                  {listing.description}
                </p>
              )}

              {/* Stats - Compact, horizontal */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-gold-600">
                  {formatPrice(listing.price, listing.is_free)}
                </span>
                {listing.pin && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{listing.pin.name}</span>
                    </span>
                  </>
                )}
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <EyeIcon className="w-4 h-4" />
                  <span className="font-medium">{listing.visit_count.toLocaleString()}</span>
                  <span className="hidden sm:inline">{listing.visit_count === 1 ? 'view' : 'views'}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  Listed {new Date(listing.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions - Right aligned, compact */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {canEdit && (
                <>
                  <button
                    onClick={() => router.push(`/market/${listing.id}/edit`)}
                    className="p-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                    aria-label="Edit listing"
                  >
                    <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isDeleting}
                    className="p-2 sm:px-4 sm:py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete listing"
                  >
                    <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              )}
              
              <button
                onClick={handleShare}
                className="p-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                aria-label="Share listing"
              >
                <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{isSharing ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {onDelete && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          entityType="listing"
          entityName={listing.title}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

