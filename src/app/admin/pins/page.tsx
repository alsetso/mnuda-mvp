import { Suspense } from 'react';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminPinService } from '@/features/admin/services/pinAdminService';
import PageLayout from '@/components/PageLayout';
import { PageSuspense } from '@/components/SuspenseBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { MapPinIcon, EyeIcon, EyeSlashIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Pins | MNUDA',
  description: 'Manage map pins and view statistics.',
  robots: 'noindex, nofollow',
};

export default async function AdminPinsPage() {
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
              Pins
            </h1>
            <p className="text-gray-600 text-lg">
              Manage all map pins and view statistics
            </p>
          </div>

          {/* Statistics */}
          <Suspense fallback={<div className="mb-8">Loading statistics...</div>}>
            <PinStats />
          </Suspense>

          {/* Pins List */}
          <Suspense fallback={<PageLoadingSkeleton />}>
            <PinsList />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

async function PinStats() {
  const service = new AdminPinService();
  const stats = await service.getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total Pins</div>
        <div className="text-3xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Public</div>
        <div className="text-3xl font-bold text-green-600">{stats.public}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Private</div>
        <div className="text-3xl font-bold text-gray-600">{stats.private}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Recent (7 days)</div>
        <div className="text-3xl font-bold text-gold-600">{stats.recent}</div>
      </div>
    </div>
  );
}

async function PinsList() {
  const service = new AdminPinService();
  const pins = await service.getAllWithDetails();

  return (
    <>
      {pins.length > 0 ? (
        <div className="space-y-4">
          {pins.map((pin) => (
            <Link
              key={pin.id}
              href={`/admin/pins/${pin.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center text-2xl">
                  {pin.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-black mb-1">
                        {pin.name}
                      </h2>
                      {pin.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {pin.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pin.visibility === 'public' ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          Public
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                          <EyeSlashIcon className="w-4 h-4" />
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="line-clamp-1">{pin.address}</span>
                    </div>
                    {pin.user && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{pin.user.name || pin.user.email}</span>
                      </div>
                    )}
                    {pin.category && (
                      <div className="flex items-center gap-1">
                        <span>{pin.category.emoji}</span>
                        <span>{pin.category.label}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {new Date(pin.created_at).toLocaleDateString()}
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
          <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            No pins found.
          </p>
        </div>
      )}
    </>
  );
}

