import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminListingService } from '@/features/admin/services/listingAdminService';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, ShoppingBagIcon, CurrencyDollarIcon, CalendarIcon, UserIcon, MapPinIcon, PencilIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Listing Details | MNUDA',
  description: 'View marketplace listing details.',
  robots: 'noindex, nofollow',
};

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminAccess();
  const { id } = await params;
  
  const service = new AdminListingService();
  const listing = await service.getByIdWithDetails(id);

  if (!listing) {
    notFound();
  }

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
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
      serverAuth={auth}
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/admin/marketplace/listings"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Listings
          </Link>

          {/* Listing Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4 flex-1">
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
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-black mb-2">
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(listing.status)}
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 capitalize">
                      {listing.listing_type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {listing.status === 'draft' && (
                  <Link
                    href={`/admin/marketplace/listings/${listing.id}/approve`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Approve
                  </Link>
                )}
                <Link
                  href={`/admin/marketplace/listings/${listing.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
              </div>
            </div>

            {/* Images */}
            {listing.image_urls && listing.image_urls.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-3">Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {listing.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${listing.title} - Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-4">Pricing</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-black">
                      {listing.is_free ? 'Free' : `$${listing.price.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">{listing.listing_type}</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-black mb-4">Metadata</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created: {new Date(listing.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Updated: {new Date(listing.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>Visits: {listing.visit_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner */}
            {listing.member && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Owner</h2>
                <div className="flex items-center gap-3">
                  {listing.member.avatar_url ? (
                    <img
                      src={listing.member.avatar_url}
                      alt={listing.member.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gold-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-black">
                      {listing.member.name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">{listing.member.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pin Location */}
            {listing.pin && (
              <div>
                <h2 className="text-lg font-semibold text-black mb-4">Location</h2>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPinIcon className="w-5 h-5 text-gold-600" />
                  <div>
                    <div className="font-semibold">{listing.pin.name}</div>
                    <div className="text-sm text-gray-600">{listing.pin.address}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

