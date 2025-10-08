'use client';

import { useState, useCallback } from 'react';
import { NodeData } from '@/features/session/services/sessionStorage';
import AddressAutocomplete from '@/features/ui/components/AddressAutocomplete';
import { NameSearchService } from '@/features/api/services/nameSearchService';
import { EmailSearchService } from '@/features/api/services/emailSearchService';
import { PhoneSearchService } from '@/features/api/services/phoneSearchService';
import { AddressService } from '@/features/api/services/addressService';
import { useToast } from '@/features/ui/hooks/useToast';
import { useSessionManager, useApiUsageContext } from '@/features/session';
import { apiUsageService } from '@/features/session/services/apiUsageService';
import { CreditsExhaustedError } from '@/features/api/services/apiService';

interface TraceFormProps {
  onSubmit: (node: NodeData) => Promise<void>;
}

// Type-safe form data structure
interface NameFormData {
  firstName: string;
  middleName: string;
  lastName: string;
}

interface AddressFormData {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export default function TraceForm({ onSubmit }: TraceFormProps) {
  const [selectedType, setSelectedType] = useState<'name' | 'email' | 'phone' | 'address'>('name');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { withApiToast } = useToast();
  const { currentSession } = useSessionManager();
  const { showCreditsModal } = useApiUsageContext();
  
  // Form state for each type
  const [nameData, setNameData] = useState<NameFormData>({
    firstName: '',
    middleName: '',
    lastName: ''
  });
  const [emailValid, setEmailValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [addressData, setAddressData] = useState<AddressFormData>({
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

  // Utility Functions
  const capitalizeWords = (str: string): string => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const stripPhoneFormatting = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailValid(isValid);
    return isValid;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = stripPhoneFormatting(phone);
    const isValid = cleaned.length === 10;
    setPhoneValid(isValid);
    return isValid;
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

  // Clear form function
  const clearForm = useCallback(() => {
    setInputValue('');
    setNameData({ firstName: '', middleName: '', lastName: '' });
    setAddressData({ street: '', city: '', state: '', zip: '' });
    setEmailValid(false);
    setPhoneValid(false);
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!currentSession) {
      setError('No session selected');
      setIsSubmitting(false);
      return;
    }

    // Check credits before making any API calls
    if (!apiUsageService.canMakeRequest()) {
      showCreditsModal();
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
            () => NameSearchService.searchName(nameParams),
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
            () => EmailSearchService.searchEmail(inputValue.trim()),
            {
              loadingMessage: `Searching email: ${inputValue.trim()}`,
              successMessage: 'Email search completed successfully',
              errorMessage: 'Failed to search email'
            }
          );
          break;

        case 'phone':
          if (!validatePhone(inputValue)) {
            setError('Please enter a valid 10-digit phone number');
            setIsSubmitting(false);
            return;
          }
          
          const strippedPhone = stripPhoneFormatting(inputValue);
          
          result = await withApiToast(
            'Phone Search',
            () => PhoneSearchService.searchPhone(strippedPhone),
            {
              loadingMessage: `Searching phone: ${inputValue}`,
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
            () => AddressService.searchAddress(addressData),
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
        clearForm();
      } else {
        setError(result.error || 'Failed to complete trace');
      }
    } catch (err) {
      console.error('Trace submission error:', err);
      if (err instanceof CreditsExhaustedError) {
        showCreditsModal();
        return;
      }
      setError('Failed to submit trace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = useCallback((type: 'name' | 'email' | 'phone' | 'address') => {
    setSelectedType(type);
    clearForm();
  }, [clearForm]);

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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {traceTypes.find(t => t.id === selectedType)?.label}
            </label>
            {(inputValue || nameData.firstName || nameData.lastName || addressData.street) && !isSubmitting && (
              <button
                type="button"
                onClick={clearForm}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
          
          {/* Name Input - Three horizontal fields with auto-capitalization */}
          {selectedType === 'name' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={nameData.firstName}
                    onChange={(e) => setNameData(prev => ({ ...prev, firstName: e.target.value }))}
                    onBlur={(e) => setNameData(prev => ({ ...prev, firstName: capitalizeWords(e.target.value) }))}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Middle Name"
                    value={nameData.middleName}
                    onChange={(e) => setNameData(prev => ({ ...prev, middleName: e.target.value }))}
                    onBlur={(e) => setNameData(prev => ({ ...prev, middleName: capitalizeWords(e.target.value) }))}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={nameData.lastName}
                    onChange={(e) => setNameData(prev => ({ ...prev, lastName: e.target.value }))}
                    onBlur={(e) => setNameData(prev => ({ ...prev, lastName: capitalizeWords(e.target.value) }))}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              {(nameData.firstName || nameData.middleName || nameData.lastName) && (
                <div className="text-xs text-gray-500 pl-1">
                  Preview: {[nameData.firstName, nameData.middleName, nameData.lastName].filter(Boolean).join(' ')}
                </div>
              )}
            </div>
          )}

          {/* Email Input - with validation and icon */}
          {selectedType === 'email' && (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value.toLowerCase());
                    validateEmail(e.target.value);
                  }}
                  placeholder="example@domain.com"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent transition-colors ${
                    inputValue && !emailValid ? 'border-red-300 bg-red-50/30' : 
                    inputValue && emailValid ? 'border-green-300 bg-green-50/30' : 
                    'border-gray-300'
                  }`}
                  disabled={isSubmitting}
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
              {inputValue && !emailValid && (
                <div className="text-xs text-red-600 pl-1">
                  Please enter a valid email address
                </div>
              )}
            </div>
          )}

          {/* Phone Input - with auto-formatting and validation */}
          {selectedType === 'phone' && (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={inputValue}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setInputValue(formatted);
                    validatePhone(formatted);
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent transition-colors ${
                    inputValue && !phoneValid ? 'border-red-300 bg-red-50/30' : 
                    inputValue && phoneValid ? 'border-green-300 bg-green-50/30' : 
                    'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {inputValue && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {phoneValid ? (
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
              {inputValue && !phoneValid && (
                <div className="text-xs text-red-600 pl-1">
                  Please enter a valid 10-digit phone number
                </div>
              )}
              {inputValue && phoneValid && (
                <div className="text-xs text-gray-500 pl-1">
                  Format: {inputValue}
                </div>
              )}
            </div>
          )}

          {/* Address Input - With icon and improved styling */}
          {selectedType === 'address' && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
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
                  placeholder="123 Main Street"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="City"
                    value={addressData.city}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                  />
                  {addressData.city && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="State"
                    value={addressData.state}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                  />
                  {addressData.state && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={addressData.zip}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                  />
                  {addressData.zip && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {validateAddress() && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Address verified
                </div>
              )}
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
