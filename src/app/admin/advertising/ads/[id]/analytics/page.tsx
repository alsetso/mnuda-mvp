import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, EyeIcon, CursorArrowRaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Ad Analytics | MNUDA',
  description: 'View ad analytics and performance.',
  robots: 'noindex, nofollow',
};

export default async function AdminAdAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminAccess();
  const { id } = await params;
  
  const service = new AdminAdService();
  // Use getByIdWithDetails which uses proper client, or getAnalytics will handle the ad lookup
  const ad = await service.getByIdWithDetails(id);
  const analytics = await service.getAnalytics(id, 30);

  if (!ad) {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/admin/advertising/ads/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Ad
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Ad Analytics
            </h1>
            <p className="text-gray-600 text-lg">
              Performance metrics for "{ad.headline}"
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <EyeIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Total Impressions</span>
              </div>
              <div className="text-3xl font-bold text-black">{analytics.impressions.toLocaleString()}</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <CursorArrowRaysIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Total Clicks</span>
              </div>
              <div className="text-3xl font-bold text-black">{analytics.clicks.toLocaleString()}</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-600 mb-2">Click-Through Rate</div>
              <div className="text-3xl font-bold text-gold-600">{analytics.ctr.toFixed(2)}%</div>
            </div>
          </div>

          {/* By Date */}
          {analytics.byDate.length > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-black mb-4">Performance by Date (Last 30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Date</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Impressions</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Clicks</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byDate.map((day) => {
                      const dayCTR = day.impressions > 0 ? (day.clicks / day.impressions * 100) : 0;
                      return (
                        <tr key={day.date} className="border-b border-gray-100">
                          <td className="py-2 px-4 text-sm text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-900 text-right">
                            {day.impressions.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-900 text-right">
                            {day.clicks.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-sm text-gold-600 text-right font-medium">
                            {dayCTR.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* By Placement */}
          {Object.keys(analytics.byPlacement).length > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-black mb-4">Performance by Placement</h2>
              <div className="space-y-3">
                {Object.entries(analytics.byPlacement).map(([placement, data]) => {
                  const placementCTR = data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0;
                  return (
                    <div key={placement} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-black capitalize">
                          {placement.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Impressions: </span>
                          <span className="font-medium text-black">{data.impressions.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Clicks: </span>
                          <span className="font-medium text-black">{data.clicks.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">CTR: </span>
                          <span className="font-medium text-gold-600">{placementCTR.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Article */}
          {Object.keys(analytics.byArticle).length > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-black mb-4">Performance by Article</h2>
              <div className="space-y-3">
                {Object.entries(analytics.byArticle).map(([article, data]) => {
                  const articleCTR = data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0;
                  return (
                    <div key={article} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-black">
                          {article === 'all_articles' ? 'All Articles' : article}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Impressions: </span>
                          <span className="font-medium text-black">{data.impressions.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Clicks: </span>
                          <span className="font-medium text-black">{data.clicks.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">CTR: </span>
                          <span className="font-medium text-gold-600">{articleCTR.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

