import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, MegaphoneIcon, EyeIcon, CursorArrowRaysIcon, CalendarIcon, UserIcon, BuildingOfficeIcon, PencilIcon, ChartBarIcon, CheckCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Ad Details | MNUDA',
  description: 'View ad details and analytics.',
  robots: 'noindex, nofollow',
};

export default async function AdminAdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminAccess();
  const { id } = await params;
  
  const service = new AdminAdService();
  const ad = await service.getByIdWithDetails(id);

  if (!ad) {
    notFound();
  }

  const ctr = ad.impression_count > 0 ? (ad.click_count / ad.impression_count * 100) : 0;

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
            href="/admin/advertising/ads"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Ads
          </Link>

          {/* Ad Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt={ad.headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MegaphoneIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black mb-2">
                    {ad.headline}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      ad.status === 'active' ? 'bg-green-100 text-green-700' :
                      ad.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      ad.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ad.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold-100 text-gold-700 capitalize">
                      {ad.placement.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/advertising/ads/${ad.id}/analytics`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  Analytics
                </Link>
                <Link
                  href={`/admin/advertising/ads/${ad.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
                {ad.status !== 'active' && (
                  <Link
                    href={`/admin/advertising/ads/${ad.id}/approve`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Approve
                  </Link>
                )}
              </div>
            </div>

            {/* Description */}
            {ad.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                <p className="text-gray-900">{ad.description}</p>
              </div>
            )}

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Impressions</span>
                </div>
                <div className="text-2xl font-bold text-black">{ad.impression_count.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CursorArrowRaysIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Clicks</span>
                </div>
                <div className="text-2xl font-bold text-black">{ad.click_count.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Click-Through Rate</div>
                <div className="text-2xl font-bold text-gold-600">{ctr.toFixed(2)}%</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Link URL</h2>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-gray-400" />
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {ad.link_url}
                  </a>
                </div>
              </div>

              {ad.target_article_slug && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Target Article</h2>
                  <p className="text-gray-900">{ad.target_article_slug}</p>
                </div>
              )}

              {ad.user && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Created By</h2>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        {ad.user.name || 'Unknown'}
                      </p>
                      <p className="text-gray-500 text-sm">{ad.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {ad.business && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Business</h2>
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900 font-medium">{ad.business.name}</p>
                  </div>
                </div>
              )}

              {ad.start_date && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Start Date</h2>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900">
                      {new Date(ad.start_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {ad.end_date && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">End Date</h2>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900">
                      {new Date(ad.end_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Created At</h2>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-900">
                    {new Date(ad.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

