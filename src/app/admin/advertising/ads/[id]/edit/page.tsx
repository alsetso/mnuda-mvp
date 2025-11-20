'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Ad, UpdateAdData, AdPlacement, AdStatus } from '@/features/ads/types';

const PLACEMENTS: AdPlacement[] = [
  'article_left',
  'article_right',
  'article_both',
  'community_left',
  'community_right',
  'community_both',
];

const STATUSES: AdStatus[] = ['draft', 'active', 'paused', 'expired'];

export default function AdminAdEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [adId, setAdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateAdData & { id: string }>({
    id: '',
    image_url: '',
    link_url: '',
    headline: '',
    description: '',
    placement: 'article_right',
    target_article_slug: '',
    status: 'draft',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setAdId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/advertising/ads&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadAd(resolvedParams.id);
        } else {
          router.push('/?message=Access denied. Admin privileges required.');
        }
      } catch (err) {
        router.push('/?message=Failed to verify admin access.');
      } finally {
        setCheckingAdmin(false);
      }
    };

    init();
  }, [user, authLoading, router, params]);

  const loadAd = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/advertising/ads/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load ad');
      }
      const ad: Ad = await response.json();
      setFormData({
        id: ad.id,
        image_url: ad.image_url,
        link_url: ad.link_url,
        headline: ad.headline,
        description: ad.description || '',
        placement: ad.placement,
        target_article_slug: ad.target_article_slug || '',
        status: ad.status,
        start_date: ad.start_date ? new Date(ad.start_date).toISOString().slice(0, 16) : '',
        end_date: ad.end_date ? new Date(ad.end_date).toISOString().slice(0, 16) : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ad');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { id, ...updateData } = formData;
      // Convert empty strings to null for optional fields
      const cleanedData: UpdateAdData = {
        ...updateData,
        description: updateData.description || null,
        target_article_slug: updateData.target_article_slug || null,
        start_date: updateData.start_date || null,
        end_date: updateData.end_date || null,
      };

      const response = await fetch(`/api/admin/advertising/ads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update ad');
      }

      router.push(`/admin/advertising/ads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad');
      setSaving(false);
    }
  };

  if (authLoading || checkingAdmin || loading) {
    return (
      <PageLayout
        showHeader={true}
        showFooter={false}
        containerMaxWidth="full"
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin || !adId) {
    return null;
  }

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <Link
              href={`/admin/advertising/ads/${adId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Ad
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Edit Ad
            </h1>
            <p className="text-gray-600 text-lg">
              Update advertisement details
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Image Preview */}
              {formData.image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="Ad preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Image URL */}
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  id="image_url"
                  required
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Headline */}
              <div>
                <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
                  Headline *
                </label>
                <input
                  type="text"
                  id="headline"
                  required
                  minLength={3}
                  maxLength={100}
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Ad headline"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={300}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none resize-none"
                  placeholder="Ad description (optional)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length}/300 characters
                </p>
              </div>

              {/* Link URL */}
              <div>
                <label htmlFor="link_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL *
                </label>
                <input
                  type="url"
                  id="link_url"
                  required
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Placement */}
              <div>
                <label htmlFor="placement" className="block text-sm font-medium text-gray-700 mb-2">
                  Placement *
                </label>
                <select
                  id="placement"
                  required
                  value={formData.placement}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      placement: e.target.value as AdPlacement,
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  {PLACEMENTS.map((placement) => (
                    <option key={placement} value={placement}>
                      {placement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Article Slug */}
              <div>
                <label htmlFor="target_article_slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Article Slug
                </label>
                <input
                  type="text"
                  id="target_article_slug"
                  value={formData.target_article_slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, target_article_slug: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Leave empty for all articles"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to show on all articles, or specify a specific article slug
                </p>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as AdStatus,
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

