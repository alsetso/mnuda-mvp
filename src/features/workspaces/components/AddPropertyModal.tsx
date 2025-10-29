"use client";

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    full_address: string;
    street_address: string;
    city: string;
    state: string;
    zipcode: string;
    status: string;
  }) => Promise<void>;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  'Preforeclosure', 'Foreclosure', 'Foreclosed', 'Auction', 'Redemption',
  'Bank Owned', 'Short Sale', 'Subject To', 'Deed In Lieu', 'Leaseback',
  'For Sale By Owner', 'Listed On MLS', 'Under Contract', 'Sold', 'Off Market'
];

export function AddPropertyModal({ isOpen, onClose, onSubmit, loading = false }: AddPropertyModalProps) {
  const [formData, setFormData] = useState({
    full_address: '',
    street_address: '',
    city: '',
    state: '',
    zipcode: '',
    status: 'Off Market'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_address.trim()) {
      newErrors.full_address = 'Full address is required';
    }
    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipcode)) {
      newErrors.zipcode = 'Please enter a valid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      full_address: '',
      street_address: '',
      city: '',
      state: '',
      zipcode: '',
      status: 'Off Market'
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Add Property</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Full Address */}
            <div>
              <label htmlFor="full_address" className="block text-sm font-medium text-gray-700 mb-1">
                Full Address *
              </label>
              <input
                type="text"
                id="full_address"
                value={formData.full_address}
                onChange={(e) => handleInputChange('full_address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123 Main St, Minneapolis, MN 55401"
                disabled={loading}
              />
              {errors.full_address && (
                <p className="mt-1 text-sm text-red-600">{errors.full_address}</p>
              )}
            </div>

            {/* Street Address */}
            <div>
              <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                id="street_address"
                value={formData.street_address}
                onChange={(e) => handleInputChange('street_address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.street_address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123 Main St"
                disabled={loading}
              />
              {errors.street_address && (
                <p className="mt-1 text-sm text-red-600">{errors.street_address}</p>
              )}
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Minneapolis"
                  disabled={loading}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="MN"
                  maxLength={2}
                  disabled={loading}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP *
                </label>
                <input
                  type="text"
                  id="zipcode"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zipcode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="55401"
                  disabled={loading}
                />
                {errors.zipcode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipcode}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
