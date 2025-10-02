'use client';

import { useState } from 'react';
import { NodeData } from '@/features/session/services/sessionStorage';
import AddressAutocomplete from '@/features/ui/components/AddressAutocomplete';
import { NameSearchService } from '@/features/api/services/nameSearchService';
import { EmailSearchService } from '@/features/api/services/emailSearchService';
import { PhoneSearchService } from '@/features/api/services/phoneSearchService';
import { AddressService } from '@/features/api/services/addressService';
import { useToast } from '@/features/ui/hooks/useToast';
import { useSessionManager } from '@/features/session';

interface TraceFormProps {
  onSubmit: (node: NodeData) => Promise<void>;
  isLoading: boolean;
}

interface TraceData {
  type: 'name' | 'email' | 'phone' | 'address';
  value: string;
}

export default function TraceForm({ onSubmit, isLoading }: TraceFormProps) {
  const [selectedType, setSelectedType] = useState<'name' | 'email' | 'phone' | 'address'>('name');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { withApiToast } = useToast();
  const { currentSession } = useSessionManager();
  
  // New state for enhanced inputs
  const [nameData, setNameData] = useState({
    firstName: '',
    middleName: '',
    lastName: ''
  });
  const [emailValid, setEmailValid] = useState(false);
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zip: ''
  });

  const traceTypes = [
    { id: 'name', label: 'Name', placeholder: 'Enter full name', icon: '👤' },
    { id: 'email', label: 'Email', placeholder: 'Enter email address', icon: '📧' },
    { id: 'phone', label: 'Phone', placeholder: 'Enter phone number', icon: '📞' },
    { id: 'address', label: 'Address', placeholder: 'Enter property address', icon: '🏠' }
  ] as const;

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (): boolean => {
    return nameData.firstName.trim() !== '' && nameData.lastName.trim() !== '';
  };

  const validateAddress = (): boolean => {
    return addressData.street.trim() !== '' && 
           addressData.city.trim() !== '' && 
           addressData.state.trim() !== '' && 
           addressData.zip.trim() !== '';
  };

  const getFullName = (): string => {
    const parts = [nameData.firstName.trim(), nameData.middleName.trim(), nameData.lastName.trim()].filter(Boolean);
    return parts.join(' ');
  };

  const getFullAddress = (): string => {
    return `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zip}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!currentSession) {
      setError('No session selected');
      setIsSubmitting(false);
      return;
    }

    try {
      let result;

      // Call appropriate API service based on selected type
      switch (selectedType) {
        case 'name':
          if (!validateName()) {
            setError('Please enter at least first and last name');
            setIsSubmitting(false);
            return;
          }
          
          const nameParams = {
            firstName: nameData.firstName.trim(),
            middleInitial: nameData.middleName.trim() ? nameData.middleName.trim()[0] : undefined,
            lastName: nameData.lastName.trim()
          };
          
          result = await withApiToast(
            'Name Search',
            () => NameSearchService.searchName(nameParams, currentSession.id),
            {
              loadingMessage: `Searching name: ${nameParams.middleInitial ? `${nameParams.firstName} ${nameParams.middleInitial} ${nameParams.lastName}` : `${nameParams.firstName} ${nameParams.lastName}`}`,
              successMessage: 'Name search completed successfully',
              errorMessage: 'Failed to search name'
            }
          );
          break;

        case 'email':
          if (!validateEmail(inputValue)) {
            setError('Please enter a valid email address');
            setIsSubmitting(false);
            return;
          }
          
          result = await withApiToast(
            'Email Search',
            () => EmailSearchService.searchEmail(inputValue.trim(), currentSession.id),
            {
              loadingMessage: `Searching email: ${inputValue.trim()}`,
              successMessage: 'Email search completed successfully',
              errorMessage: 'Failed to search email'
            }
          );
          break;

        case 'phone':
          if (!inputValue.trim()) {
            setError('Please enter a phone number');
            setIsSubmitting(false);
            return;
          }
          
          result = await withApiToast(
            'Phone Search',
            () => PhoneSearchService.searchPhone(inputValue.trim(), currentSession.id),
            {
              loadingMessage: `Searching phone: ${inputValue.trim()}`,
              successMessage: 'Phone search completed successfully',
              errorMessage: 'Failed to search phone'
            }
          );
          break;

        case 'address':
          if (!validateAddress()) {
            setError('Please complete all address fields');
            setIsSubmitting(false);
            return;
          }
          
          result = await withApiToast(
            'Address Search',
            () => AddressService.searchAddress(addressData, currentSession.id),
            {
              loadingMessage: `Searching address: ${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zip}`,
              successMessage: 'Address search completed successfully',
              errorMessage: 'Failed to search address'
            }
          );
          break;

        default:
          setError('Invalid trace type');
          setIsSubmitting(false);
          return;
      }

      if (result.success && result.node) {
        await onSubmit(result.node);
        
        // Clear form on success
        setInputValue('');
        setNameData({ firstName: '', middleName: '', lastName: '' });
        setAddressData({ street: '', city: '', state: '', zip: '' });
        setEmailValid(false);
      } else {
        setError(result.error || 'Failed to complete trace');
      }
    } catch (err) {
      console.error('Trace submission error:', err);
      setError('Failed to submit trace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: 'name' | 'email' | 'phone' | 'address') => {
    setSelectedType(type);
    setInputValue('');
    setError('');
    setNameData({ firstName: '', middleName: '', lastName: '' });
    setAddressData({ street: '', city: '', state: '', zip: '' });
    setEmailValid(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skip Trace</h2>
        <p className="text-gray-600">Enter information to trace and find associated data</p>
      </div>


      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What would you like to trace?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {traceTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeChange(type.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedType === type.id
                    ? 'border-[#1dd1f5] bg-[#1dd1f5]/10 text-[#014463]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-xs font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Input Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {traceTypes.find(t => t.id === selectedType)?.label}
          </label>
          
          {/* Name Input - Three horizontal fields */}
          {selectedType === 'name' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="First Name *"
                  value={nameData.firstName}
                  onChange={(e) => setNameData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={nameData.middleName}
                  onChange={(e) => setNameData(prev => ({ ...prev, middleName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={nameData.lastName}
                  onChange={(e) => setNameData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Email Input - with validation */}
          {selectedType === 'email' && (
            <div className="relative">
              <input
                type="email"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setEmailValid(validateEmail(e.target.value));
                }}
                placeholder="Enter email address"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent pr-10 ${
                  inputValue && !emailValid ? 'border-red-300' : 
                  inputValue && emailValid ? 'border-green-300' : 
                  'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {inputValue && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailValid ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Phone Input */}
          {selectedType === 'phone' && (
            <input
              type="tel"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              disabled={isLoading}
            />
          )}

          {/* Address Input - Two lines with geocoding */}
          {selectedType === 'address' && (
            <div className="space-y-3">
              <div>
                <AddressAutocomplete
                  value={addressData.street}
                  onChange={(value) => setAddressData(prev => ({ ...prev, street: value }))}
                  onAddressSelect={(address) => {
                    setAddressData({
                      street: address.street,
                      city: address.city,
                      state: address.state,
                      zip: address.zip
                    });
                  }}
                  placeholder="Enter street address"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={addressData.city}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addressData.state}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={addressData.zip}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1dd1f5] hover:bg-[#014463] text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Tracing...
            </>
          ) : (
            `Trace ${traceTypes.find(t => t.id === selectedType)?.label}`
          )}
        </button>
      </form>
    </div>
  );
}
