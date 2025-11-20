import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminBusinessService } from '@/features/admin/services/businessAdminService';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, BuildingOfficeIcon, UserIcon, MapPinIcon, GlobeAltIcon, PencilIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Business Details | MNUDA',
  description: 'View business details.',
  robots: 'noindex, nofollow',
};

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminAccess();
  const { id } = await params;
  
  const service = new AdminBusinessService();
  const business = await service.getByIdWithDetails(id);

  if (!business) {
    notFound();
  }

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
            href="/admin/users/businesses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Businesses
          </Link>

          {/* Business Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4 flex-1">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-12 h-12 text-gold-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-black mb-2">
                    {business.name}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/users/businesses/${business.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
              </div>
            </div>

            {/* Description */}
            {business.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{business.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-4">Contact Information</h2>
                <div className="space-y-2">
                  {business.website && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <GlobeAltIcon className="w-5 h-5 text-gold-600" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold-600 hover:text-gold-700 underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-black mb-4">Metadata</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created: {new Date(business.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Updated: {new Date(business.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            {(business.address_line1 || business.city) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Address</h2>
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPinIcon className="w-5 h-5 text-gold-600 mt-0.5" />
                  <div>
                    {business.address_line1 && (
                      <div>{business.address_line1}</div>
                    )}
                    {(business.city || business.state || business.zip_code) && (
                      <div>
                        {business.city && business.city}
                        {business.city && business.state && ', '}
                        {business.state && business.state}
                        {business.zip_code && ` ${business.zip_code}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Owner */}
            {business.member && (
              <div>
                <h2 className="text-lg font-semibold text-black mb-4">Owner</h2>
                <div className="flex items-center gap-3">
                  {business.member.avatar_url ? (
                    <img
                      src={business.member.avatar_url}
                      alt={business.member.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gold-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-black">
                      {business.member.name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">{business.member.email}</div>
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

