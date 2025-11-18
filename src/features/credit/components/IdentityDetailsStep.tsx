'use client';

import { useState, FormEvent } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { IdentityDetails } from '../types';

interface IdentityDetailsStepProps {
  initialData: IdentityDetails | null;
  onSubmit: (data: IdentityDetails) => void;
  onBack: (() => void) | null;
}

export function IdentityDetailsStep({ initialData, onSubmit, onBack }: IdentityDetailsStepProps) {
  const [formData, setFormData] = useState<Partial<IdentityDetails>>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    middleName: initialData?.middleName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    ssn: initialData?.ssn || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    previousAddresses: initialData?.previousAddresses || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreviousAddresses, setShowPreviousAddresses] = useState(
    (initialData?.previousAddresses?.length || 0) > 0
  );

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddPreviousAddress = () => {
    setFormData(prev => ({
      ...prev,
      previousAddresses: [
        ...(prev.previousAddresses || []),
        { street: '', city: '', state: '', zipCode: '', yearsAtAddress: '' },
      ],
    }));
  };

  const handleRemovePreviousAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      previousAddresses: prev.previousAddresses?.filter((_, i) => i !== index) || [],
    }));
  };

  const handlePreviousAddressChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      previousAddresses: prev.previousAddresses?.map((addr, i) =>
        i === index ? { ...addr, [field]: value } : addr
      ) || [],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.ssn?.trim()) {
      newErrors.ssn = 'SSN is required';
    } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(formData.ssn.replace(/-/g, ''))) {
      newErrors.ssn = 'SSN must be in format XXX-XX-XXXX';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.address?.street?.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }
    if (!formData.address?.city?.trim()) {
      newErrors['address.city'] = 'City is required';
    }
    if (!formData.address?.state?.trim()) {
      newErrors['address.state'] = 'State is required';
    }
    if (!formData.address?.zipCode?.trim()) {
      newErrors['address.zipCode'] = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      middleName: formData.middleName,
      dateOfBirth: formData.dateOfBirth!,
      ssn: formData.ssn!,
      email: formData.email!,
      phone: formData.phone!,
      address: formData.address!,
      previousAddresses: formData.previousAddresses?.filter(
        addr => addr.street && addr.city && addr.state && addr.zipCode
      ),
    });
  };

  const formatSSN = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Identity Details</h2>
        <p className="text-gray-600 mb-6">
          Please provide your personal information to begin the credit restoration process.
        </p>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black border-b-2 border-gray-200 pb-2">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.firstName && (
              <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.lastName && (
              <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Social Security Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ssn}
              onChange={(e) => handleInputChange('ssn', formatSSN(e.target.value))}
              maxLength={11}
              placeholder="XXX-XX-XXXX"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.ssn ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.ssn && (
              <p className="text-xs text-red-600 mt-1">{errors.ssn}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black border-b-2 border-gray-200 pb-2">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Current Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black border-b-2 border-gray-200 pb-2">
          Current Address
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address?.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors['address.street'] ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors['address.street'] && (
              <p className="text-xs text-red-600 mt-1">{errors['address.street']}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address?.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                  errors['address.city'] ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors['address.city'] && (
                <p className="text-xs text-red-600 mt-1">{errors['address.city']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address?.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                  errors['address.state'] ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors['address.state'] && (
                <p className="text-xs text-red-600 mt-1">{errors['address.state']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address?.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                  errors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors['address.zipCode'] && (
                <p className="text-xs text-red-600 mt-1">{errors['address.zipCode']}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Previous Addresses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
          <h3 className="text-lg font-semibold text-black">Previous Addresses</h3>
          <button
            type="button"
            onClick={() => setShowPreviousAddresses(!showPreviousAddresses)}
            className="text-sm text-gold-600 hover:text-gold-700 font-medium"
          >
            {showPreviousAddresses ? 'Hide' : 'Add Previous Address'}
          </button>
        </div>

        {showPreviousAddresses && (
          <div className="space-y-4">
            {formData.previousAddresses?.map((addr, index) => (
              <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-black">Previous Address {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemovePreviousAddress(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={addr.street}
                    onChange={(e) => handlePreviousAddressChange(index, 'street', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={addr.city}
                      onChange={(e) => handlePreviousAddressChange(index, 'city', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addr.state}
                      onChange={(e) => handlePreviousAddressChange(index, 'state', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={addr.zipCode}
                      onChange={(e) => handlePreviousAddressChange(index, 'zipCode', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="text"
                      placeholder="Years at Address"
                      value={addr.yearsAtAddress}
                      onChange={(e) => handlePreviousAddressChange(index, 'yearsAtAddress', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPreviousAddress}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gold-500 hover:text-gold-600 transition-colors"
            >
              + Add Another Previous Address
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}


