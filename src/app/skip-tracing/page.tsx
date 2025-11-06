'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { SkipTraceService, SkipTraceResult } from '@/features/api/services/skipTraceService';

type SearchType = 'name' | 'email' | 'phone' | 'address';

const searchTypeOptions: { value: SearchType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'name', label: 'Name', icon: UserIcon },
  { value: 'email', label: 'Email', icon: EnvelopeIcon },
  { value: 'phone', label: 'Phone', icon: PhoneIcon },
  { value: 'address', label: 'Address', icon: MapPinIcon },
];

// Helper to parse address input
// Format: "Street Address, City, State ZIP" or "Street Address, City State ZIP"
function parseAddressInput(input: string): { street: string; citystatezip: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse common address formats
  // Format 1: "Street, City, State ZIP"
  const commaMatch = trimmed.match(/^(.+?),\s*(.+?),\s*(.+)$/);
  if (commaMatch) {
    const [, street, city, stateZip] = commaMatch;
    return {
      street: street.trim(),
      citystatezip: `${city.trim()}, ${stateZip.trim()}`,
    };
  }

  // Format 2: "Street, City State ZIP" (no comma before state)
  const spaceMatch = trimmed.match(/^(.+?),\s*(.+?)\s+([A-Z]{2})\s+(\d{5}(-\d{4})?)$/i);
  if (spaceMatch) {
    const [, street, city, state, zip] = spaceMatch;
    return {
      street: street.trim(),
      citystatezip: `${city.trim()}, ${state.toUpperCase()} ${zip}`,
    };
  }

  // If we can't parse, assume entire input is street and try to extract city/state/zip from end
  // Fallback: use entire input as street, user should provide city/state/zip separately
  // For now, return null to indicate parsing failed
  return null;
}

export default function SkipTracingPage() {
  const [searchType, setSearchType] = useState<SearchType>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SkipTraceResult | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [previousResults, setPreviousResults] = useState<SkipTraceResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Load previous results on mount
  useEffect(() => {
    const loadPreviousResults = async () => {
      setIsLoadingResults(true);
      try {
        const results = await SkipTraceService.getUserSkipTraces(20);
        setPreviousResults(results);
      } catch (err) {
        console.error('Error loading previous results:', err);
      } finally {
        setIsLoadingResults(false);
      }
    };

    loadPreviousResults();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);
    setShowComingSoon(false);

    try {
      let params: { name?: string; address?: { street: string; citystatezip: string }; phone?: string; email?: string };

      // Parse input based on search type
      if (searchType === 'address') {
        const parsed = parseAddressInput(searchQuery);
        if (!parsed) {
          throw new Error('Invalid address format. Please use format: "Street Address, City, State ZIP" (e.g., "3828 Double Oak Ln, Irving, TX 75061")');
        }
        params = { address: parsed };
      } else if (searchType === 'name') {
        params = { name: searchQuery.trim() };
      } else if (searchType === 'phone') {
        params = { phone: searchQuery.trim() };
      } else if (searchType === 'email') {
        params = { email: searchQuery.trim() };
      } else {
        throw new Error(`Unknown search type: ${searchType}`);
      }

      const result = await SkipTraceService.executeSkipTrace(searchType, searchQuery.trim(), params);
      setResult(result);
      // Reload previous results to include the new one
      const results = await SkipTraceService.getUserSkipTraces(20);
      setPreviousResults(results);
    } catch (err) {
      // Check if it's a subscription error
      if (err instanceof Error && (err as { isSubscriptionError?: boolean }).isSubscriptionError) {
        setShowComingSoon(true);
        setError(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during the search';
        setError(errorMessage);
        setShowComingSoon(false);
      }
      console.error('Skip trace search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Format response for display
  const formatResponse = (result: SkipTraceResult): string => {
    if (result.developer_data) {
      // Try to extract meaningful data
      const data = result.developer_data;
      
      // Extract person details if available
      if (Array.isArray(data.personDetails) && data.personDetails.length > 0) {
        const person = data.personDetails[0];
        const parts = [];
        if (person.personName) parts.push(`Name: ${person.personName}`);
        if (person.age) parts.push(`Age: ${person.age}`);
        if (person.livesIn) parts.push(`Location: ${person.livesIn}`);
        if (parts.length > 0) return parts.join(' • ');
      }
      
      // Extract emails if available
      if (Array.isArray(data.emails) && data.emails.length > 0) {
        return `Emails: ${data.emails.slice(0, 3).join(', ')}${data.emails.length > 3 ? '...' : ''}`;
      }
      
      // Extract phones if available
      if (Array.isArray(data.phones) && data.phones.length > 0) {
        const phones = data.phones.map((p: { phoneNumber?: string } | string) => 
          typeof p === 'string' ? p : p.phoneNumber || ''
        ).filter(Boolean);
        if (phones.length > 0) {
          return `Phones: ${phones.slice(0, 3).join(', ')}${phones.length > 3 ? '...' : ''}`;
        }
      }
      
      // Extract addresses if available
      if (Array.isArray(data.currentAddresses) && data.currentAddresses.length > 0) {
        const addr = data.currentAddresses[0];
        if (addr.streetAddress) {
          return `Address: ${addr.streetAddress}, ${addr.addressLocality || ''} ${addr.addressRegion || ''}`.trim();
        }
      }
      
      // Fallback to status/message
      if (data.status !== undefined || data.message) {
        return `Status: ${data.status || 'OK'}${data.message ? ` - ${data.message}` : ''}`;
      }
    }
    
    // Fallback to raw response summary
    const raw = result.raw_response;
    if (raw && typeof raw === 'object') {
      if ('message' in raw && typeof raw.message === 'string') {
        return raw.message;
      }
      if ('status' in raw) {
        return `Response: ${raw.status}`;
      }
    }
    
    return 'No data available';
  };

  const selectedOption = searchTypeOptions.find(opt => opt.value === searchType);
  const SelectedIcon = selectedOption?.icon || UserIcon;

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full mb-3 border border-gold-200">
          <BoltIcon className="w-4 h-4 text-gold-600" />
          <span className="text-xs sm:text-sm font-semibold text-gold-700">AI-Powered Skip Tracing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-[-0.05em] text-black mb-2 leading-tight font-libre-baskerville italic">
          Skip Tracing
          <span className="block text-gold-600">Search</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Find people and property information using advanced skip tracing technology.
        </p>
      </div>

      {/* Search Interface */}
      <div className="space-y-4 lg:space-y-6">
        {/* Search Type Selector */}
        <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Search Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {searchTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = searchType === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSearchType(option.value)}
                      className={`
                        flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200
                        ${isActive
                          ? 'border-gold-500 bg-gold-50 text-gold-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gold-300 hover:bg-gold-50/50'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-gold-600' : 'text-gray-400'}`} />
                      <span className="text-xs sm:text-sm font-semibold">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <SelectedIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Enter ${selectedOption?.label.toLowerCase()}...`}
                className="w-full pl-11 pr-24 sm:pr-28 py-3 sm:py-4 text-base bg-white border-2 border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {isSearching ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
                </button>
              </div>

            {/* Helper Text */}
            <div className="flex items-start gap-2 p-3 bg-gold-50 rounded-lg border border-gold-200">
              <BoltIcon className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gold-900 mb-1">AI-Powered Search</p>
                <p className="text-xs text-gold-700">
                    {searchType === 'name' && 'Enter a full name or partial name to find associated information.'}
                    {searchType === 'email' && 'Enter an email address to find associated contact information and locations.'}
                    {searchType === 'phone' && 'Enter a phone number to find associated names, addresses, and more.'}
                    {searchType === 'address' && 'Enter an address in format: "Street Address, City, State ZIP" (e.g., "3828 Double Oak Ln, Irving, TX 75061")'}
                  </p>
                </div>
              </div>
            </form>

        {/* Coming Soon Message */}
        {showComingSoon && (
            <div className="p-4 bg-gold-50 rounded-lg border-2 border-gold-200">
              <h3 className="text-base font-bold text-gold-900 mb-2">Service Coming Soon</h3>
              <p className="text-sm text-gold-800 mb-3">
                  We&apos;re working on finalizing this service. In the meantime, please reach out to us at{' '}
                  <a 
                    href="mailto:support@mnuda.com" 
                    className="font-semibold underline hover:text-gold-600"
                  >
                    support@mnuda.com
                  </a>
                  {' '}to discuss your skip tracing needs.
                </p>
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="text-sm font-semibold text-gold-700 hover:text-gold-900 underline"
                >
                  Close
                </button>
              </div>
            )}

        {/* Error Message */}
        {error && !showComingSoon && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-900 mb-1">Search Error</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}

        {/* Success Result */}
        {result && (
            <div className="p-4 border-2 border-gold-200 rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <h3 className="text-base font-semibold text-gray-900">Search Results</h3>
                <span className="ml-auto text-xs text-gray-500">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Search Type:</span>
                      <span className="ml-2 text-gray-900 capitalize">{result.api_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Query:</span>
                      <span className="ml-2 text-gray-900">{result.search_query}</span>
                    </div>
                  </div>

                {/* Developer Data */}
                {result.developer_data && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Structured Data</h4>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 border border-gray-200">
                      {JSON.stringify(result.developer_data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw Response */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Raw API Response</h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 border border-gray-200">
                    {JSON.stringify(result.raw_response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

        {/* Previous Results List */}
        <div>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-4">Previous Searches</h2>
            {isLoadingResults ? (
              <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
            ) : previousResults.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No previous searches</div>
            ) : (
              <div className="space-y-2">
                {previousResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gold-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {result.api_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(result.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 break-words">
                      {result.search_query}
                    </div>
                    <div className="text-xs text-gray-700 break-words">
                      {formatResponse(result)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </PageLayout>
  );
}

