'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppWrapper from '@/components/app/AppWrapper';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { City, UpdateCityData } from '@/features/admin/services/cityAdminService';
import AddCoordinatesMap from '@/components/map/AddCoordinatesMap';

export default function AdminCityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [cityId, setCityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<{ previousId: string | null; nextId: string | null; currentIndex: number; total: number } | null>(null);
  // Autamn state - persists across navigation via localStorage
  const [autamnEnabled, setAutamnEnabled] = useState(false);
  const [autamnSearchQuery, setAutamnSearchQuery] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateCityData & { id: string }>({
    id: '',
    name: '',
    population: 0,
    county: '',
    lat: null,
    lng: null,
    meta_title: null,
    meta_description: null,
    website_url: null,
    favorite: false,
  });

  // Load Autamn state from localStorage on mount
  useEffect(() => {
    const savedAutamn = localStorage.getItem('autamnEnabled');
    if (savedAutamn === 'true') {
      setAutamnEnabled(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setCityId(resolvedParams.id);
      // Load city data immediately (blocking)
      await loadCity(resolvedParams.id);
      // Load navigation in background (non-blocking)
      loadNavigation(resolvedParams.id);
    };
    init();
  }, [params]);

  // Auto-trigger Autamn when city loads if Autamn is enabled and city has no coordinates
  useEffect(() => {
    if (autamnEnabled && !loading && formData.name && (!formData.lat || !formData.lng)) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        const searchText = `${formData.name}, Minnesota, `;
        setAutamnSearchQuery(searchText);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autamnEnabled, loading, formData.name, formData.lat, formData.lng]);

  const loadNavigation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cities/${id}/navigation`);
      if (response.ok) {
        const nav = await response.json();
        setNavigation(nav);
      }
    } catch (err) {
      console.error('Error loading navigation:', err);
    }
  };

  const loadCity = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      // Reset search query when loading new city
      setAutamnSearchQuery(null);
      
      const response = await fetch(`/api/admin/cities/${id}`);
      if (!response.ok) {
        if (response.status === 403) {
          router.replace('/login?redirect=/admin/cities&message=Please sign in to access admin panel');
          return;
        }
        throw new Error('Failed to load city');
      }
      const city: City = await response.json();
      setFormData({
        id: city.id,
        name: city.name,
        population: city.population,
        county: city.county,
        lat: city.lat,
        lng: city.lng,
        meta_title: city.meta_title,
        meta_description: city.meta_description,
        website_url: city.website_url,
        favorite: city.favorite,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load city');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/cities/${cityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          population: formData.population,
          county: formData.county,
          lat: formData.lat ? parseFloat(formData.lat.toString()) : null,
          lng: formData.lng ? parseFloat(formData.lng.toString()) : null,
          meta_title: formData.meta_title || null,
          meta_description: formData.meta_description || null,
          website_url: formData.website_url || null,
          favorite: formData.favorite,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // If there's a next city, navigate to it immediately (fast path for sequential editing)
      if (navigation?.nextId) {
        router.push(`/admin/cities/${navigation.nextId}/edit`);
      } else {
        // Otherwise, go back to list
        router.push('/admin/cities');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save city');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppWrapper>
        <div className="min-h-screen bg-gold-100 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar with Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/admin/cities"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Cities
            </Link>
            
            {/* Navigation Buttons */}
            {navigation && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 mr-2">
                  {navigation.currentIndex} / {navigation.total}
                </span>
                <Link
                  href={navigation.previousId ? `/admin/cities/${navigation.previousId}/edit` : '#'}
                  className={`p-2 rounded-lg border ${
                    navigation.previousId
                      ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                  onClick={(e) => !navigation.previousId && e.preventDefault()}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </Link>
                <Link
                  href={navigation.nextId ? `/admin/cities/${navigation.nextId}/edit` : '#'}
                  className={`p-2 rounded-lg border ${
                    navigation.nextId
                      ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                  onClick={(e) => !navigation.nextId && e.preventDefault()}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-black mb-4">Edit City</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label htmlFor="county" className="block text-xs font-medium text-gray-700 mb-1">
                    County *
                  </label>
                  <input
                    type="text"
                    id="county"
                    required
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label htmlFor="population" className="block text-xs font-medium text-gray-700 mb-1">
                    Population *
                  </label>
                  <input
                    type="number"
                    id="population"
                    required
                    min="0"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Coordinates
                </label>
                <AddCoordinatesMap
                  initialCoordinates={
                    formData.lat && formData.lng
                      ? { lat: formData.lat, lng: formData.lng }
                      : null
                  }
                  onCoordinatesChange={(coordinates) => {
                    setFormData({
                      ...formData,
                      lat: coordinates?.lat ?? null,
                      lng: coordinates?.lng ?? null,
                    });
                  }}
                  externalSearchQuery={autamnSearchQuery || undefined}
                  autoFocus={autamnEnabled}
                  onSearchTriggered={() => {
                    // Search was triggered
                  }}
                  height="350px"
                  placeholder="Search for the city location..."
                />
              </div>

              {/* SEO Fields */}
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900">SEO Settings</h2>
                
                <div>
                  <label htmlFor="meta_title" className="block text-xs font-medium text-gray-700 mb-1">
                    SEO Title (optional, max 70 characters)
                  </label>
                  <input
                    type="text"
                    id="meta_title"
                    maxLength={70}
                    value={formData.meta_title || ''}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value || null })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="Custom SEO title (defaults to generated title if empty)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {(formData.meta_title?.length || 0)} / 70 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="meta_description" className="block text-xs font-medium text-gray-700 mb-1">
                    SEO Description (optional, max 160 characters)
                  </label>
                  <textarea
                    id="meta_description"
                    maxLength={160}
                    rows={3}
                    value={formData.meta_description || ''}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value || null })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="Custom SEO meta description (defaults to generated description if empty)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {(formData.meta_description?.length || 0)} / 160 characters
                  </p>
                </div>
              </div>

              {/* Website and Favorite Fields */}
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900">Additional Settings</h2>
                
                <div>
                  <label htmlFor="website_url" className="block text-xs font-medium text-gray-700 mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    id="website_url"
                    value={formData.website_url || ''}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value || null })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="https://www.example.gov/"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.favorite}
                      onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
                      className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Mark as favorite city</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <Link
                  href="/admin/cities"
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Link>
                
                <div className="flex items-center gap-3">
                  {/* Autamn Widget - Next to Save Button */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autamnEnabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setAutamnEnabled(enabled);
                        // Persist to localStorage
                        localStorage.setItem('autamnEnabled', enabled ? 'true' : 'false');
                        
                        if (enabled && formData.name) {
                          // Set search query with city name + ", Minnesota, "
                          const searchText = `${formData.name}, Minnesota, `;
                          setAutamnSearchQuery(searchText);
                          // Search will be triggered after 2 seconds by AddCoordinatesMap
                        } else {
                          setAutamnSearchQuery(null);
                        }
                      }}
                      className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                    />
                    <span className={`text-xs font-medium ${autamnEnabled ? 'text-gold-600 font-bold' : 'text-gray-600'}`}>
                      Autamn {autamnEnabled && <span className="text-gold-500">(Autopilot)</span>}
                    </span>
                  </label>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {saving ? 'Saving...' : (navigation?.nextId ? 'Save & Next' : 'Save Changes')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}

