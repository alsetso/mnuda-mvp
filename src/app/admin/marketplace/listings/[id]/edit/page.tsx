'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AdminListing, UpdateListingData } from '@/features/admin/services/listingAdminService';

export default function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [listingId, setListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateListingData & { id: string }>({
    id: '',
    title: '',
    description: '',
    listing_type: 'physical',
    price: 0,
    is_free: false,
    status: 'active',
    image_urls: [],
    pin_id: null,
  });

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setListingId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/marketplace/listings&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadListing(resolvedParams.id);
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

  const loadListing = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/marketplace/listings/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load listing');
      }
      const listing: AdminListing = await response.json();
      setFormData({
        id: listing.id,
        title: listing.title,
        description: listing.description || '',
        listing_type: listing.listing_type,
        price: listing.price,
        is_free: listing.is_free,
        status: listing.status,
        image_urls: listing.image_urls || [],
        pin_id: listing.pin_id || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId) return;
    
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/marketplace/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update listing');
      }

      router.push(`/admin/marketplace/listings/${listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
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

  if (!isAdmin || !listingId) {
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/admin/marketplace/listings/${listingId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Listing
          </Link>

          {/* Edit Form */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-black mb-6">Edit Listing</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  minLength={3}
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={6}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                />
              </div>

              {/* Listing Type */}
              <div>
                <label htmlFor="listing_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  id="listing_type"
                  required
                  value={formData.listing_type}
                  onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as 'physical' | 'digital' })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked, price: 0 })}
                    className="mr-2"
                  />
                  Free Listing
                </label>
                {!formData.is_free && (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                    placeholder="0.00"
                  />
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Image URLs */}
              <div>
                <label htmlFor="image_urls" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URLs (one per line)
                </label>
                <textarea
                  id="image_urls"
                  rows={4}
                  value={formData.image_urls?.join('\n') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    image_urls: e.target.value.split('\n').filter(url => url.trim()) 
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
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
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

