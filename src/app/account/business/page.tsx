'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { BusinessService, Business, CreateBusinessData } from '@/features/business';
import MainContentNav from '@/components/MainContentNav';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import AddressAutocomplete from '@/features/ui/components/AddressAutocomplete';

export default function BusinessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateBusinessData>({
    name: '',
    description: '',
    website: '',
    logo_url: null,
    address_line1: '',
    city: '',
    state: 'MN',
    zip_code: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadBusinesses();
    }
  }, [user, authLoading, router]);

  // Handle edit query parameter after businesses are loaded
  useEffect(() => {
    if (businesses.length > 0 && searchParams) {
      const editId = searchParams.get('edit');
      if (editId && !editingId) {
        const businessToEdit = businesses.find(b => b.id === editId);
        if (businessToEdit) {
          startEdit(businessToEdit);
        }
      }
    }
  }, [businesses, searchParams]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const data = await BusinessService.getUserBusinesses();
      setBusinesses(data);
    } catch (error) {
      console.error('Error loading businesses:', error);
      showError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const business = await BusinessService.createBusiness(formData);
      setBusinesses([business, ...businesses]);
      setIsCreating(false);
      resetForm();
      success('Business created successfully');
    } catch (error) {
      console.error('Error creating business:', error);
      showError(error instanceof Error ? error.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setLoading(true);
      const business = await BusinessService.updateBusiness(id, formData);
      setBusinesses(businesses.map(b => b.id === id ? business : b));
      setEditingId(null);
      resetForm();
      success('Business updated successfully');
    } catch (error) {
      console.error('Error updating business:', error);
      showError(error instanceof Error ? error.message : 'Failed to update business');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await BusinessService.deleteBusiness(id);
      setBusinesses(businesses.filter(b => b.id !== id));
      setDeleteConfirmId(null);
      success('Business deleted successfully');
    } catch (error) {
      console.error('Error deleting business:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete business');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (business: Business) => {
    setEditingId(business.id);
    setFormData({
      name: business.name,
      description: business.description || '',
      website: business.website || '',
      logo_url: business.logo_url || null,
      address_line1: business.address_line1 || '',
      city: business.city || '',
      state: business.state || 'MN',
      zip_code: business.zip_code || '',
    });
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      logo_url: null,
      address_line1: '',
      city: '',
      state: 'MN',
      zip_code: '',
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleAddressSelect = (address: { street: string; city: string; state: string; zip: string }) => {
    // Normalize state: convert 'Minnesota' to 'MN', keep 'MN' as is, default to 'MN' for anything else
    const stateValue = address.state?.trim() || '';
    let normalizedState = 'MN'; // Default to 'MN' per database constraint
    if (stateValue.toLowerCase() === 'minnesota' || stateValue.toUpperCase() === 'MN') {
      normalizedState = 'MN';
    }
    
    setFormData({
      ...formData,
      address_line1: address.street,
      city: address.city,
      state: normalizedState,
      zip_code: address.zip,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <MainContentNav title="My Businesses" />
        {!isCreating && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            New Business
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-black mb-6">
            {editingId ? 'Edit Business' : 'Create New Business'}
          </h2>
          
          <div className="space-y-4">
            {/* Logo */}
            <div>
              <ImageUpload
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: typeof url === 'string' ? url : null })}
                bucket="members_business_logo"
                table="businesses"
                column="logo_url"
                label="Business Logo"
                disabled={loading}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                placeholder="Enter business name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none resize-none"
                placeholder="Describe your business"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                placeholder="https://example.com"
              />
            </div>

            {/* Address with Mapbox Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <AddressAutocomplete
                value={formData.address_line1 || ''}
                onChange={(value) => setFormData({ ...formData, address_line1: value })}
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing an address..."
                disabled={loading}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Minneapolis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || 'MN'}
                  readOnly
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip_code || ''}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="55401"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                disabled={loading || !formData.name}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingId ? 'Update Business' : 'Create Business'}
              </button>
              <button
                onClick={resetForm}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Businesses List */}
      {!isCreating && !editingId && (
        <div className="space-y-4">
          {businesses.length > 0 ? (
            businesses.map((business) => (
              <div
                key={business.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Link 
                    href={`/business/${business.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <BuildingOfficeIcon className="w-6 h-6 text-gold-600" />
                      )}
                      <h3 className="text-xl font-bold text-black hover:text-gold-600 transition-colors">{business.name}</h3>
                    </div>
                    {business.description && (
                      <p className="text-gray-700 mb-3">{business.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {business.city && (
                        <span>{business.city}, {business.state}</span>
                      )}
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {business.website}
                        </a>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(business);
                      }}
                      className="p-2 text-gray-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    {deleteConfirmId === business.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(business.id);
                          }}
                          disabled={loading}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(business.id);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
              <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-6">
                No businesses yet. Create your first business to get started.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Create Business
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

