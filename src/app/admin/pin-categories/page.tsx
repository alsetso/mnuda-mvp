'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { PinCategory } from '@/features/pins/services/pinService';
import { TagIcon } from '@heroicons/react/24/outline';

export default function PinCategoriesAdminPage() {
  const [categories, setCategories] = useState<PinCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/pin-categories');
      
      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = '/login?redirect=/admin/pin-categories&message=Please sign in to access admin panel';
          return;
        }
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const updateIsPublic = async (categoryId: string, is_public: boolean) => {
    try {
      setIsSaving(prev => ({ ...prev, [categoryId]: true }));
      setError(null);

      const response = await fetch('/api/admin/pin-categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId, is_public }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = '/login?redirect=/admin/pin-categories&message=Please sign in to access admin panel';
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      const updatedCategory = await response.json();
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? updatedCategory : cat
        )
      );
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setIsSaving(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Filter to show only the three main categories
  const mainCategories = categories.filter(cat =>
    ['project', 'listing', 'public_concern'].includes(cat.slug)
  );

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
            <div className="flex items-center gap-3 mb-2">
              <TagIcon className="w-8 h-8 text-gold-600" />
              <h1 className="text-4xl sm:text-5xl font-bold text-black">
                Pin Categories
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Manage which categories appear in map filters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="text-gray-600">Loading categories...</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-black">
                  Map Filter Visibility
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Toggle which categories appear in the map filters. Only categories with "Public" enabled will be shown to users.
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {mainCategories.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    No categories found
                  </div>
                ) : (
                  mainCategories.map(category => (
                    <div
                      key={category.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-2xl">{category.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-black">
                                {category.label}
                              </h3>
                              {!category.is_active && (
                                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                  inactive
                                </span>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {category.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Slug: <code className="bg-gray-100 px-1 rounded">{category.slug}</code>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 ml-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={category.is_public}
                              onChange={(e) =>
                                updateIsPublic(category.id, e.target.checked)
                              }
                              disabled={isSaving[category.id]}
                              className="w-5 h-5 rounded border-gray-300 text-gold-600 focus:ring-gold-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Public
                            </span>
                          </label>
                          {isSaving[category.id] && (
                            <div className="w-4 h-4 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8">
            <a
              href="/admin"
              className="text-gold-600 hover:text-gold-700 font-medium text-sm"
            >
              ← Back to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

