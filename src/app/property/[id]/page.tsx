'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HomeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { formatZillowResponse } from '@/features/workspaces/services/zillowFormatter';
import Logo from '@/features/ui/components/Logo';

interface Property {
  id: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  status: string;
  raw_zillow_response?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export default function PublicPropertyPage() {
  const params = useParams();
  const propertyId = params?.id as string | undefined;
  const [code, setCode] = useState('');
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Show error if property ID is missing
  useEffect(() => {
    if (!propertyId) {
      setError('Invalid property ID in URL');
    }
  }, [propertyId]);

  const fetchProperty = async (propertyCode: string) => {
    if (!propertyId) {
      setError('Property ID is missing');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = `/api/property/${propertyId}?code=${encodeURIComponent(propertyCode)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Property fetch failed:', { status: response.status, error: data });
        throw new Error(data.error || 'Failed to fetch property');
      }

      const data = await response.json();
      setProperty(data);
      setIsVerified(true);
      // Store verification in sessionStorage
      sessionStorage.setItem(`property_${propertyId}_verified`, 'true');
      sessionStorage.setItem(`property_${propertyId}_code`, propertyCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property');
      setProperty(null);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if code is already verified (stored in sessionStorage)
  useEffect(() => {
    if (!propertyId) return;
    
    const verified = sessionStorage.getItem(`property_${propertyId}_verified`);
    const storedCode = sessionStorage.getItem(`property_${propertyId}_code`);
    if (verified === 'true' && storedCode) {
      setCode(storedCode);
      setIsVerified(true);
      fetchProperty(storedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      fetchProperty(code.trim());
    }
  };

  const handleReset = () => {
    setCode('');
    setProperty(null);
    setError('');
    setIsVerified(false);
    sessionStorage.removeItem(`property_${propertyId}_verified`);
    sessionStorage.removeItem(`property_${propertyId}_code`);
  };

  if (!propertyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Property URL</h1>
          <p className="text-gray-600">The property ID is missing from the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Nav with Logo */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Logo size="md" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!isVerified ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <HomeIcon className="w-16 h-16 text-[#014463] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Property Access
              </h1>
              <p className="text-gray-600">
                Enter the access code to view this property
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014463] focus:border-transparent text-center text-lg tracking-wider"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!code.trim() || isLoading}
                className="w-full px-4 py-3 bg-[#014463] text-white font-medium rounded-lg hover:bg-[#01304a] focus:outline-none focus:ring-2 focus:ring-[#014463] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Verifying...' : 'View Property'}
              </button>
            </form>
          </div>
        ) : property ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#014463] px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Property Details</h1>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm text-white bg-[#01304a] rounded hover:bg-[#012538] transition-colors"
                >
                  Reset Access
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Property Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Address Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-[#014463]" />
                      Address
                    </h2>
                    <div className="space-y-2 text-gray-700">
                      <p className="text-lg font-medium">{property.full_address}</p>
                      <p className="text-sm">
                        {property.city}, {property.state} {property.zipcode}
                      </p>
                      {property.latitude && property.longitude && (
                        <p className="text-xs text-gray-500 mt-2">
                          Coordinates: {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Status</h2>
                    <span className="inline-block px-3 py-1 bg-[#1dd1f5]/20 text-[#014463] rounded-full text-sm font-medium border border-[#1dd1f5]/30">
                      {property.status}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Property Information</h2>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Added:</span>
                        <p className="text-gray-900 mt-1">
                          {new Date(property.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <p className="text-gray-900 mt-1">
                          {new Date(property.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Zillow Data */}
                <div className="lg:col-span-2">

                  {/* Zillow Data Section */}
                  {property.raw_zillow_response && (() => {
                    try {
                      const formatted = formatZillowResponse(property.raw_zillow_response);
                      
                      return (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-[#014463]">Zillow Data</span>
                          </h2>
                          <div className="space-y-6">
                        {/* Property Image */}
                        {formatted.image_url && (
                          <div>
                            <img 
                              src={formatted.image_url} 
                              alt="Property" 
                              className="w-full h-64 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}

                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-500">ZPID</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.zpid ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Home Status</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.home_status ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Home Type</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.home_type ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Year Built</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.year_built ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Bedrooms</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.bedrooms ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Bathrooms</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.bathrooms ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Living Area</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.living_area ? `${formatted.living_area.toLocaleString()} sqft` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Lot Size</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.lot_size ? `${formatted.lot_size.toLocaleString()} sqft` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Location</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-500">Street Address</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.street_address ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">City</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.city ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">State</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.state ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">ZIP Code</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.zipcode ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">County</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.county ?? 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Coordinates</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.latitude && formatted.longitude 
                                  ? `${formatted.latitude.toFixed(6)}, ${formatted.longitude.toFixed(6)}`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Pricing</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-500">Price</span>
                              <p className="text-sm text-gray-900 mt-1 font-medium">
                                {formatted.price ? `$${formatted.price.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Zestimate</span>
                              <p className="text-sm text-gray-900 mt-1 font-medium">
                                {formatted.zestimate ? `$${formatted.zestimate.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Rent Zestimate</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.rent_zestimate ? `$${formatted.rent_zestimate.toLocaleString()}/mo` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Last Sold Price</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.last_sold_price ? `$${formatted.last_sold_price.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Last Sold Date</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.last_sold_date ?? 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Tax Information */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Tax Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-500">Assessed Value</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.tax_assessed_value ? `$${formatted.tax_assessed_value.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Annual Tax</span>
                              <p className="text-sm text-gray-900 mt-1">
                                {formatted.tax_annual_amount ? `$${formatted.tax_annual_amount.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          {formatted.tax_history.length > 0 && (
                            <div className="mt-4">
                              <span className="text-xs text-gray-500 block mb-2">Tax History (Last 5 Years)</span>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-700 font-medium">Year</th>
                                      <th className="px-3 py-2 text-left text-gray-700 font-medium">Value</th>
                                      <th className="px-3 py-2 text-left text-gray-700 font-medium">Tax Paid</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {formatted.tax_history.map((tax, idx) => (
                                      <tr key={idx}>
                                        <td className="px-3 py-2 text-gray-900">{tax.year ?? 'N/A'}</td>
                                        <td className="px-3 py-2 text-gray-900">
                                          {tax.value !== null ? `$${tax.value.toLocaleString()}` : 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-900">
                                          {tax.taxPaid !== null ? `$${tax.taxPaid.toLocaleString()}` : 'N/A'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price History */}
                        {formatted.price_history.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Price History</h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Date</th>
                                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Event</th>
                                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Price</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {formatted.price_history.map((price, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-gray-900">{price.date ?? 'N/A'}</td>
                                      <td className="px-3 py-2 text-gray-900">{price.event ?? 'N/A'}</td>
                                      <td className="px-3 py-2 text-gray-900">
                                        {price.price !== null ? `$${price.price.toLocaleString()}` : 'N/A'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Schools */}
                        {formatted.school_summary && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Schools</h3>
                            <p className="text-sm text-gray-900">{formatted.school_summary}</p>
                          </div>
                        )}

                        {/* Description */}
                        {formatted.description && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Description</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{formatted.description}</p>
                          </div>
                        )}

                        {/* Engagement Metrics */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Engagement</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-500">Page Views</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.page_view_count.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Favorites</span>
                              <p className="text-sm text-gray-900 mt-1">{formatted.favorite_count.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error('Error formatting Zillow data:', error);
                      return (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zillow Data</h2>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-700 mb-2">Error formatting Zillow data.</p>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-2">
                              <pre className="text-xs text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap break-words">
                                {JSON.stringify(property.raw_zillow_response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

