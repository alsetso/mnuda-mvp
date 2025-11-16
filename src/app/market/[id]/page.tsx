'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useListing } from '@/features/marketplace/hooks/useListing';
import { ListingHeader } from '@/features/marketplace/components/ListingHeader';
import { ListingService } from '@/features/marketplace/services/listingService';
import { MapPinIcon, ShoppingBagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidId = listingId && uuidRegex.test(listingId);
  const {
    listing,
    isLoading,
    deleteListing,
  } = useListing(listingId);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteListing();
      success('Listing Deleted', 'Your listing has been deleted.');
      router.push('/market');
    } catch (err) {
      showError('Failed to Delete', err instanceof Error ? err.message : 'Please try again.');
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to view listings.</p>
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

  const formatPrice = (price: number, isFree: boolean) => {
    if (isFree) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  return (
    <PageLayout 
      showHeader={true} 
      showFooter={false} 
      containerMaxWidth="full" 
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen">
        {/* Header - Full width, flush with app header */}
        <ListingHeader
          listing={listing}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />

        {/* Content - Centered with max width for readability */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {/* Images Gallery */}
            {listing.image_urls && listing.image_urls.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.image_urls.map((url, index) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`${listing.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <ShoppingBagIcon className="w-6 h-6 text-gold-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-semibold text-black">
                        {listing.listing_type === 'physical' ? 'Physical Item' : 'Digital Item'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-semibold text-gold-600 text-lg">
                        {formatPrice(listing.price, listing.is_free)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-gold-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Listed</p>
                      <p className="font-semibold text-black">
                        {new Date(listing.created_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  {listing.pin && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <MapPinIcon className="w-6 h-6 text-gold-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-semibold text-black">{listing.pin.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{listing.pin.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Description */}
              {listing.description && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">Description</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Seller Info */}
              {listing.user && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-black mb-4">Seller</h2>
                  <div className="flex items-center gap-4">
                    {listing.user.avatar_url ? (
                      <img
                        src={listing.user.avatar_url}
                        alt={listing.user.name || 'Seller'}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center">
                        <span className="text-gold-600 font-semibold">
                          {listing.user.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-black">
                        {listing.user.name || 'Anonymous Seller'}
                      </p>
                      <p className="text-sm text-gray-500">Member since {new Date(listing.created_at).getFullYear()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

