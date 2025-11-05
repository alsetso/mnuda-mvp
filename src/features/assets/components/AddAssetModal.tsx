'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AssetService, AssetType, CreateAssetData, Asset } from '../services/assetService';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset: Asset) => void;
}

export default function AddAssetModal({ isOpen, onClose, onSuccess }: AddAssetModalProps) {
  const [formData, setFormData] = useState<Omit<CreateAssetData, 'value'> & { value: number | null }>({
    type: 'business',
    name: '',
    description: '',
    owned_since: '',
    value: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof CreateAssetData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const assetData: CreateAssetData = {
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        owned_since: formData.owned_since || null,
        value: typeof formData.value === 'number' ? formData.value : null,
      };

      if (!assetData.name) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      const newAsset = await AssetService.createAsset(assetData);
      onSuccess(newAsset);
      handleClose();
    } catch (err) {
      console.error('Error creating asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'business',
      name: '',
      description: '',
      owned_since: '',
      value: null,
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border border-gold-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gold-200 bg-gold-50">
            <h3 className="text-lg font-black text-black">Add Asset</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-black transition-colors"
              disabled={loading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Asset Type */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Asset Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="business"
                    checked={formData.type === 'business'}
                    onChange={(e) => handleChange('type', e.target.value as AssetType)}
                    className="w-4 h-4 text-gold-600 border-gray-300 focus:ring-gold-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Business</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="property"
                    checked={formData.type === 'property'}
                    onChange={(e) => handleChange('type', e.target.value as AssetType)}
                    className="w-4 h-4 text-gold-600 border-gray-300 focus:ring-gold-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Property</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                placeholder="Enter asset name"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-black mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none resize-none"
                placeholder="Add a description (optional)"
                disabled={loading}
              />
            </div>

            {/* Owned Since */}
            <div>
              <label htmlFor="owned_since" className="block text-sm font-semibold text-black mb-2">
                Owned Since
              </label>
              <input
                type="date"
                id="owned_since"
                value={formData.owned_since || ''}
                onChange={(e) => handleChange('owned_since', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                disabled={loading}
              />
            </div>

            {/* Value */}
            <div>
              <label htmlFor="value" className="block text-sm font-semibold text-black mb-2">
                Value ($)
              </label>
              <input
                type="number"
                id="value"
                value={formData.value?.toString() || ''}
                onChange={(e) => handleChange('value', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Asset'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

