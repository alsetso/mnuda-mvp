import { Suspense } from 'react';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';
import PageLayout from '@/components/PageLayout';
import { PageSuspense } from '@/components/SuspenseBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { MegaphoneIcon, EyeIcon, CursorArrowRaysIcon, CalendarIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Ads | MNUDA',
  description: 'Manage advertisements and view analytics.',
  robots: 'noindex, nofollow',
};

export default async function AdminAdsPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Advertisements
            </h1>
            <p className="text-gray-600 text-lg">
              Manage all ads and view analytics
            </p>
          </div>

          {/* Statistics */}
          <Suspense fallback={<div className="mb-8">Loading statistics...</div>}>
            <AdStats />
          </Suspense>

          {/* Ads List */}
          <Suspense fallback={<PageLoadingSkeleton />}>
            <AdsList />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

async function AdStats() {
  const service = new AdminAdService();
  const stats = await service.getStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total</div>
        <div className="text-3xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Active</div>
        <div className="text-3xl font-bold text-green-600">{stats.active}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Paused</div>
        <div className="text-3xl font-bold text-amber-600">{stats.paused}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Draft</div>
        <div className="text-3xl font-bold text-gray-600">{stats.draft}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Expired</div>
        <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Impressions</div>
        <div className="text-3xl font-bold text-blue-600">{stats.totalImpressions.toLocaleString()}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Clicks</div>
        <div className="text-3xl font-bold text-purple-600">{stats.totalClicks.toLocaleString()}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">CTR</div>
        <div className="text-3xl font-bold text-gold-600">{stats.overallCTR.toFixed(2)}%</div>
      </div>
    </div>
  );
}

async function AdsList() {
  const service = new AdminAdService();
  const ads = await service.getAllWithDetails();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-amber-100 text-amber-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {ads.length > 0 ? (
        <div className="space-y-4">
          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/admin/advertising/ads/${ad.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt={ad.headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MegaphoneIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-black mb-1">
                        {ad.headline}
                      </h2>
                      {ad.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {ad.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ad.status)}`}>
                      {ad.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{ad.impression_count.toLocaleString()} impressions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CursorArrowRaysIcon className="w-4 h-4" />
                      <span>{ad.click_count.toLocaleString()} clicks</span>
                    </div>
                    {ad.impression_count > 0 && (
                      <span className="text-gold-600 font-medium">
                        {(ad.click_count / ad.impression_count * 100).toFixed(2)}% CTR
                      </span>
                    )}
                    {ad.user && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{ad.user.name || ad.user.email}</span>
                      </div>
                    )}
                    {ad.business && (
                      <div className="flex items-center gap-1">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span>{ad.business.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {new Date(ad.created_at).toLocaleDateString()}
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
          <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            No ads found.
          </p>
        </div>
      )}
    </>
  );
}

