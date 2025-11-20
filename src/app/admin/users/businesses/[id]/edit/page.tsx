'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AdminBusiness } from '@/features/admin/services/businessAdminService';
import { UpdateBusinessData } from '@/features/business/services/businessService';

export default function AdminBusinessEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateBusinessData & { id: string }>({
    id: '',
    name: '',
    description: '',
    website: '',
    logo_url: '',
    address_line1: '',
    city: '',
    state: 'MN',
    zip_code: '',
  });

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setBusinessId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/users/businesses&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadBusiness(resolvedParams.id);
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

  const loadBusiness = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/businesses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load business');
      }
      const business: AdminBusiness = await response.json();
      setFormData({
        id: business.id,
        name: business.name,
        description: business.description || '',
        website: business.website || '',
        logo_url: business.logo_url || '',
        address_line1: business.address_line1 || '',
        city: business.city || '',
        state: business.state || 'MN',
        zip_code: business.zip_code || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update business');
      }

      router.push(`/admin/users/businesses/${businessId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business');
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

  if (!isAdmin || !businessId) {
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
            href={`/admin/users/businesses/${businessId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Business
          </Link>

          {/* Edit Form */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-black mb-6">Edit Business</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  minLength={2}
                  maxLength={200}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                />
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                    placeholder="MN"
                  />
                </div>
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
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

