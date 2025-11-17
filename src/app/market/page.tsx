'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useListings } from '@/features/marketplace/hooks/useListings';
import { ListingCard } from '@/features/marketplace/components/ListingCard';
import { CreateListingModal } from '@/features/marketplace/components/CreateListingModal';
import { ListingService } from '@/features/marketplace/services/listingService';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import type { MarketplaceListing } from '@/features/marketplace/types';

type FilterType = 'all' | 'mine';

export default function MarketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { listings, isLoading, refreshListings } = useListings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const { success, error: showError } = useToast();
  
  // Load user's listings when filter is "mine"
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([]);
  const [isLoadingUserListings, setIsLoadingUserListings] = useState(false);
  const hasLoadedUserListings = useRef(false);
  
  const loadUserListings = async () => {
    if (!user || hasLoadedUserListings.current || isLoadingUserListings) return;
    
    setIsLoadingUserListings(true);
    hasLoadedUserListings.current = true;
    try {
      const data = await ListingService.getUserListings();
      setUserListings(data);
    } catch (err) {
      console.error('Error loading user listings:', err);
      showError('Failed to Load', 'Could not load your listings.');
      hasLoadedUserListings.current = false; // Allow retry on error
    } finally {
      setIsLoadingUserListings(false);
    }
  };
  
  // Filter listings based on selected filter
  const filteredListings = useMemo(() => {
    if (filter === 'mine') {
      return userListings;
    }
    return listings;
  }, [filter, listings, userListings]);
  
  const isFilterLoading = isLoading || (filter === 'mine' && isLoadingUserListings);

  const handleCreateListing = async (data: { title: string; description?: string | null; listing_type: 'physical' | 'digital'; price: number; is_free: boolean; image_urls?: string[]; pin_id?: string | null; status?: 'active' | 'sold' | 'expired' | 'draft' }) => {
    try {
      const listing = await ListingService.createListing(data);
      success('Listing Created', `${listing.title} has been created!`);
      await refreshListings();
      router.push(`/market/${listing.id}`);
      return listing;
    } catch (err) {
      showError('Failed to Create Listing', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to view market.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <div className="min-h-screen bg-gold-100">
        {/* Hero Section */}
        <div className="bg-black text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-6xl font-bold mb-6">
                Browse Minnesota Opportunity
              </h1>
              <p className="text-2xl text-white/80 mb-8 leading-relaxed">
                Discover or manage off-market real estate listings and opportunities across Minnesota.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold text-lg rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Listing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <>
            {/* Filter Tabs */}
            <div className="mb-6 flex items-center gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  hasLoadedUserListings.current = false; // Reset when switching away
                }}
                className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-gold-500 text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Listings
              </button>
              <button
                onClick={() => {
                  setFilter('mine');
                  loadUserListings();
                }}
                className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                  filter === 'mine'
                    ? 'bg-gold-500 text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                My Listings
              </button>
            </div>

              {/* Listings Grid */}
              {isFilterLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-16 text-center">
                  <p className="text-gray-500 text-lg mb-2">
                    {filter === 'mine' ? "You haven't created any listings yet." : 'No listings yet.'}
                  </p>
                  <p className="text-gray-400 mb-6">
                    {filter === 'mine' 
                      ? 'Create your first listing to start selling!'
                      : 'Create your first listing to get started!'
                    }
                  </p>
                  {filter === 'all' && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Listing
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
          </>
        </div>
      </div>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateListing={handleCreateListing}
      />
    </PageLayout>
  );
}

