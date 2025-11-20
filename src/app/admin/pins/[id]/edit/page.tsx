'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Pin, UpdatePinData } from '@/features/pins/services/pinService';
import { PinCategoryService } from '@/features/pins/services/pinService';

export default function AdminPinEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [pinId, setPinId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; label: string; emoji: string }>>([]);
  const [formData, setFormData] = useState<UpdatePinData & { id: string }>({
    id: '',
    emoji: '',
    name: '',
    visibility: 'public',
    description: '',
    address: '',
    lat: 0,
    long: 0,
    category_id: null,
    subcategory: null,
  });

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setPinId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/pins&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadPin(resolvedParams.id);
          await loadCategories();
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

  const loadPin = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pins/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load pin');
      }
      const pin: Pin = await response.json();
      setFormData({
        id: pin.id,
        emoji: pin.emoji,
        name: pin.name,
        visibility: pin.visibility,
        description: pin.description || '',
        address: pin.address,
        lat: pin.lat,
        long: pin.long,
        category_id: pin.category_id,
        subcategory: pin.subcategory,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pin');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await PinCategoryService.getAllCategories();
      setCategories(cats.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        label: cat.label,
        emoji: cat.emoji,
      })));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { id, ...updateData } = formData;
      const response = await fetch(`/api/admin/pins/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update pin');
      }

      router.push(`/admin/pins/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pin');
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

  if (!isAdmin || !pinId) {
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
              href={`/admin/pins/${pinId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Pin
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Edit Pin
            </h1>
            <p className="text-gray-600 text-lg">
              Update pin details
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
              {/* Emoji */}
              <div>
                <label htmlFor="emoji" className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji *
                </label>
                <input
                  type="text"
                  id="emoji"
                  required
                  maxLength={10}
                  value={formData.emoji}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, emoji: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none text-2xl"
                  placeholder="🏗️"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  minLength={1}
                  maxLength={200}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Pin name"
                />
              </div>

              {/* Visibility */}
              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  id="visibility"
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      visibility: e.target.value as 'public' | 'private',
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value || null }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none resize-none"
                  placeholder="Pin description"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category_id"
                  value={formData.category_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category_id: e.target.value || null,
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  value={formData.subcategory || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subcategory: e.target.value || null,
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Subcategory"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Street address"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    id="lat"
                    required
                    step="any"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lat: parseFloat(e.target.value) }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="long" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    id="long"
                    required
                    step="any"
                    value={formData.long}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, long: parseFloat(e.target.value) }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none font-mono text-sm"
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

