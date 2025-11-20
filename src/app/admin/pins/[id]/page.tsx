import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminPinService } from '@/features/admin/services/pinAdminService';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, MapPinIcon, EyeIcon, EyeSlashIcon, CalendarIcon, UserIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Pin Details | MNUDA',
  description: 'View pin details.',
  robots: 'noindex, nofollow',
};

export default async function AdminPinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminAccess();
  const { id } = await params;
  
  const service = new AdminPinService();
  const pin = await service.getByIdWithDetails(id);

  if (!pin) {
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
            href="/admin/pins"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Pins
          </Link>

          {/* Pin Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gold-100 rounded-lg flex items-center justify-center text-4xl">
                  {pin.emoji}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black mb-2">
                    {pin.name}
                  </h1>
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
                    {pin.category && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold-100 text-gold-700 flex items-center gap-1">
                        <span>{pin.category.emoji}</span>
                        <span>{pin.category.label}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/pins/${pin.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  href={`/admin/pins/${pin.id}/delete`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </Link>
              </div>
            </div>

            {/* Description */}
            {pin.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                <p className="text-gray-900">{pin.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Address</h2>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{pin.address}</p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Coordinates</h2>
                <p className="text-gray-900 font-mono text-sm">
                  {pin.lat.toFixed(6)}, {pin.long.toFixed(6)}
                </p>
              </div>

              {pin.user && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Created By</h2>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        {pin.user.name || 'Unknown'}
                      </p>
                      <p className="text-gray-500 text-sm">{pin.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Created At</h2>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-900">
                    {new Date(pin.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {pin.subcategory && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Subcategory</h2>
                  <p className="text-gray-900">{pin.subcategory}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

