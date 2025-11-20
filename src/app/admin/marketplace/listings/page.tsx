import { Suspense } from 'react';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminListingService } from '@/features/admin/services/listingAdminService';
import PageLayout from '@/components/PageLayout';
import { PageSuspense } from '@/components/SuspenseBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { ShoppingBagIcon, CalendarIcon, UserIcon, MapPinIcon, CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Marketplace Listings | MNUDA',
  description: 'Manage marketplace listings and view statistics.',
  robots: 'noindex, nofollow',
};

export default async function AdminMarketplaceListingsPage() {
  const auth = await requireAdminAccess();

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
      serverAuth={auth}
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
                  Marketplace Listings
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage all marketplace listings and view statistics
                </p>
              </div>
              <Link
                href="/admin"
                className="text-gold-600 hover:text-gold-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <Suspense fallback={<div className="mb-8">Loading statistics...</div>}>
            <ListingStats />
          </Suspense>

          {/* Listings List */}
          <Suspense fallback={<PageLoadingSkeleton />}>
            <ListingsList />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

async function ListingStats() {
  const service = new AdminListingService();
  const stats = await service.getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total Listings</div>
        <div className="text-3xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Active</div>
        <div className="text-3xl font-bold text-green-600">{stats.active}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Draft</div>
        <div className="text-3xl font-bold text-yellow-600">{stats.draft}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Sold</div>
        <div className="text-3xl font-bold text-blue-600">{stats.sold}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total Value</div>
        <div className="text-3xl font-bold text-gold-600">
          ${stats.totalValue.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

async function ListingsList() {
  const service = new AdminListingService();
  const listings = await service.getAllWithDetails();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            Active
          </span>
        );
      case 'sold':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            Sold
          </span>
        );
      case 'expired':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
            <XCircleIcon className="w-4 h-4" />
            Expired
          </span>
        );
      case 'draft':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/admin/marketplace/listings/${listing.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
            >
              <div className="flex items-start gap-4">
                {listing.image_urls && listing.image_urls.length > 0 ? (
                  <img
                    src={listing.image_urls[0]}
                    alt={listing.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBagIcon className="w-12 h-12 text-gold-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-black mb-1">
                        {listing.title}
                      </h2>
                      {listing.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(listing.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span className="font-semibold text-black">
                        {listing.is_free ? 'Free' : `$${listing.price.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{listing.listing_type}</span>
                    </div>
                    {listing.member && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{listing.member.name || listing.member.email}</span>
                      </div>
                    )}
                    {listing.pin && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="line-clamp-1">{listing.pin.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
          <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No listings found</p>
        </div>
      )}
    </>
  );
}

