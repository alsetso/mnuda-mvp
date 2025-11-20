import { Suspense } from 'react';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminBusinessService } from '@/features/admin/services/businessAdminService';
import PageLayout from '@/components/PageLayout';
import { PageSuspense } from '@/components/SuspenseBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { BuildingOfficeIcon, CalendarIcon, UserIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Businesses | MNUDA',
  description: 'Manage businesses and view statistics.',
  robots: 'noindex, nofollow',
};

export default async function AdminBusinessesPage() {
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
                  Businesses
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage all businesses and view statistics
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
            <BusinessStats />
          </Suspense>

          {/* Businesses List */}
          <Suspense fallback={<PageLoadingSkeleton />}>
            <BusinessesList />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

async function BusinessStats() {
  try {
    const service = new AdminBusinessService();
    const stats = await service.getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total Businesses</div>
        <div className="text-3xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">With Website</div>
        <div className="text-3xl font-bold text-green-600">{stats.withWebsite}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">With Address</div>
        <div className="text-3xl font-bold text-blue-600">{stats.withAddress}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Recent (7 days)</div>
        <div className="text-3xl font-bold text-gold-600">{stats.recent}</div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error loading business stats:', error);
    return (
      <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
        <p className="text-red-700 font-medium">
          Error loading statistics: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}

async function BusinessesList() {
  const service = new AdminBusinessService();
  const businesses = await service.getAllWithDetails();

  return (
    <>
      {businesses.length > 0 ? (
        <div className="space-y-4">
          {businesses.map((business) => (
            <Link
              key={business.id}
              href={`/admin/users/businesses/${business.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
            >
              <div className="flex items-start gap-4">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-8 h-8 text-gold-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-black mb-1">
                        {business.name}
                      </h2>
                      {business.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {business.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                    {business.member && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{business.member.name || business.member.email}</span>
                      </div>
                    )}
                    {business.city && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>
                          {business.city}
                          {business.state && `, ${business.state}`}
                        </span>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-1">
                        <GlobeAltIcon className="w-4 h-4" />
                        <span className="truncate max-w-xs">{business.website}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {new Date(business.created_at).toLocaleDateString()}
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
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No businesses found</p>
        </div>
      )}
    </>
  );
}

