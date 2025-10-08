'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface UserFoundNodeProps {
  onLocationFound: (coords: { lat: number; lng: number }, address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } }) => void;
  onStartTracking: () => void;
  onStopTracking?: () => void;
  onCreateNewLocationSession?: () => void;
  onContinueToAddressSearch?: () => void;
  isTracking: boolean;
  userLocation?: { lat: number; lng: number } | null;
  status: 'pending' | 'ready';
  hasCompleted?: boolean;
  payload?: {
    coords: { lat: number; lng: number };
    address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } };
    locationHistory?: Array<{
      coords: { lat: number; lng: number };
      address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } };
      timestamp: number;
    }>;
  };
}

export default function UserFoundNode({ 
  onLocationFound, 
  onStartTracking, 
  onStopTracking,
  onCreateNewLocationSession,
  onContinueToAddressSearch,
  isTracking, 
  userLocation, 
  status,
  hasCompleted,
  payload 
}: UserFoundNodeProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hasReverseGeocoded, setHasReverseGeocoded] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationFound, setLocationFound] = useState(false);
  const [, setForceUpdate] = useState(0);

  // Simple retry utility
  const withRetry = async (fn: () => Promise<unknown>, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const handleLocationFound = useCallback(async (coords: { lat: number; lng: number }) => {
    if (isRequesting) return; // Prevent duplicate requests
    setIsRequesting(true);
    setIsGeocoding(true);
    
    try {
      // Check if online before making request
      if (!isOnline) {
        console.warn('Offline - skipping reverse geocoding');
        onLocationFound(coords);
        return;
      }

      // Reverse geocode to get address with retry logic
      const response = await withRetry(async () => {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&types=address`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Geocoding failed: ${res.status} ${res.statusText}`);
        }
        return res;
      });
      
      const data = await (response as Response).json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const addressComponents = feature.context || [];
        
        // Extract address components
        const street = feature.text || '';
        const city = addressComponents.find((c: Record<string, unknown>) => (c.id as string).startsWith('place'))?.text || '';
        const state = addressComponents.find((c: Record<string, unknown>) => (c.id as string).startsWith('region'))?.text || '';
        const zip = addressComponents.find((c: Record<string, unknown>) => (c.id as string).startsWith('postcode'))?.text || '';

        const address = {
          street,
          city,
          state,
          zip,
          coordinates: { latitude: coords.lat, longitude: coords.lng }
        };

        onLocationFound(coords, address);
      } else {
        onLocationFound(coords);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onLocationFound(coords);
    } finally {
      setIsGeocoding(false);
      setIsRequesting(false);
    }
  }, [isRequesting, isOnline, onLocationFound]);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for session updates to trigger re-renders
  useEffect(() => {
    const handleSessionUpdate = () => {
      // Force re-render when session is updated
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('sessionUpdated', handleSessionUpdate as EventListener);
    return () => window.removeEventListener('sessionUpdated', handleSessionUpdate as EventListener);
  }, []);

  // Handle location updates during tracking with debouncing
  useEffect(() => {
    if (userLocation && isTracking) {
      // Debounce session storage updates to prevent excessive writes
      const debounceTimeout = setTimeout(() => {
        onLocationFound(userLocation);
      }, 500); // 500ms debounce
      
      // Only reverse geocode once when tracking starts
      if (!hasReverseGeocoded && !payload?.address) {
        setHasReverseGeocoded(true);
        handleLocationFound(userLocation);
      }
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [userLocation, isTracking, onLocationFound, hasReverseGeocoded, payload?.address, handleLocationFound]);


  // Update current location immediately when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setCurrentLocation(userLocation);
      setLocationFound(true);
      console.log('UserFoundNode: userLocation updated:', userLocation);
    }
  }, [userLocation]);

  // Debug: Log when userLocation changes
  useEffect(() => {
    if (userLocation && isTracking) {
      console.log('UserFoundNode: userLocation updated:', userLocation);
    }
  }, [userLocation, isTracking]);

  // Reset reverse geocoding flag when tracking stops
  useEffect(() => {
    if (!isTracking) {
      setHasReverseGeocoded(false);
      setLocationFound(false);
    }
  }, [isTracking]);

  const handleFindMe = () => {
    if (hasCompleted && onCreateNewLocationSession) {
      // Create a new tracking session
      onCreateNewLocationSession();
    } else {
      // Start tracking on current node
      onStartTracking();
    }
  };

  const handleStopTracking = () => {
    if (onStopTracking) {
      onStopTracking();
    }
  };

  return (
    <div className="bg-transparent">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">User Location</h3>
            <p className="text-xs text-gray-400">Location Services</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              (status === 'ready' || locationFound) ? 'bg-green-400' : 
              isTracking ? 'bg-yellow-400' : 
              'bg-[#1dd1f5]'
            }`}></div>
            <span className="text-xs text-gray-400">
              {(status === 'ready' || locationFound) ? 'Location Found' : 
               isTracking ? 'Searching...' : 
               'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-6 py-2">
        {status === 'pending' && !hasCompleted && !locationFound ? (
          /* Pending State - Find Location */
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#1dd1f5]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Find your location to begin skip tracing</h4>
              <p className="text-sm text-gray-500 mb-4">
                We&apos;ll use your location to help you find addresses and start your skip trace session.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
              <button
                onClick={handleFindMe}
                disabled={isTracking || isRequesting || !isOnline}
                aria-label={isTracking ? "Finding your location" : "Find my current location"}
                aria-describedby="location-help-text"
                className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-medium text-white bg-[#014463] border border-transparent rounded hover:bg-[#1dd1f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014463] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]"
              >
                {(isTracking || isRequesting) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <span>{isGeocoding ? 'Getting Address...' : 'Finding Location...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{!isOnline ? 'Offline' : 'Find Me'}</span>
                  </>
                )}
              </button>
              {!isOnline && (
                <p id="location-help-text" className="text-xs text-red-600 mt-2 text-center">
                  You&apos;re currently offline. Please check your internet connection.
                </p>
              )}
            </div>
          </div>
        ) : hasCompleted ? (
          /* Completed State - Tracking Finished */
          <div className="space-y-3">
            <div className="bg-white/20 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Tracking Complete</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={onCreateNewLocationSession}
                    disabled={isRequesting}
                    aria-label="Start a new location tracking session"
                    className="text-xs bg-[#1dd1f5] hover:bg-[#014463] disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors flex items-center space-x-1"
                  >
                    {isRequesting && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>New Location Session</span>
                  </button>
                  <button
                    onClick={onContinueToAddressSearch}
                    disabled={isRequesting}
                    aria-label="Continue to address search with current location"
                    className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors flex items-center space-x-1"
                  >
                    {isRequesting && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Continue with Address Search</span>
                  </button>
                </div>
              </div>
              
              {/* Final coordinates */}
              <div className="text-sm text-gray-700 mb-2">
                <div className="font-medium">Final Location:</div>
                <div className="text-xs text-gray-500 font-mono">
                  {payload?.coords?.lat !== undefined && payload?.coords?.lng !== undefined ? 
                    `${payload.coords.lat.toFixed(6)}, ${payload.coords.lng.toFixed(6)}` :
                    'No coordinates available'
                  }
                </div>
              </div>
              
              {payload?.address && (
                <div className="text-sm text-gray-700 mb-1">
                  <div className="font-medium">Address:</div>
                  <div className="text-xs text-gray-500">
                    {payload.address.street && `${payload.address.street}, `}
                    {payload.address.city && `${payload.address.city}, `}
                    {payload.address.state && `${payload.address.state} `}
                    {payload.address.zip && payload.address.zip}
                  </div>
                </div>
              )}

              {/* Location history count */}
              {payload?.locationHistory && payload.locationHistory.length > 0 && (
                <div className="text-xs text-gray-500">
                  <button
                    onClick={() => setShowLocationHistory(!showLocationHistory)}
                    className="text-[#1dd1f5] hover:text-[#014463] underline cursor-pointer"
                  >
                    {payload.locationHistory.length} location{payload.locationHistory.length !== 1 ? 's' : ''} recorded
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Choose &quot;New Location Session&quot; to start fresh tracking or &quot;Continue with Address Search&quot; to proceed.
            </div>
          </div>
        ) : (
          /* Active/Ready State - Currently Tracking or Ready */
          <div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">
                    {isTracking ? 'Live Tracking' : 'Location Found'}
                  </span>
                </div>
                {isTracking && (
                  <button
                    onClick={handleStopTracking}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    Stop
                  </button>
                )}
              </div>
              
              {/* Real-time coordinates */}
              <div className="text-sm text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium">Current Location:</div>
                  {isTracking && (userLocation || currentLocation) && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">LIVE</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {(isTracking && (userLocation || currentLocation)) ? 
                    `${(userLocation || currentLocation)!.lat.toFixed(6)}, ${(userLocation || currentLocation)!.lng.toFixed(6)}` :
                    (payload?.coords?.lat !== undefined && payload?.coords?.lng !== undefined) ? 
                    `${payload.coords.lat.toFixed(6)}, ${payload.coords.lng.toFixed(6)}` :
                    'No coordinates available'
                  }
                </div>
                {isTracking && (userLocation || currentLocation) && (
                  <div className="text-xs text-gray-400 mt-1">
                    <div>Updated: {new Date().toLocaleTimeString()}</div>
                  </div>
                )}
              </div>
              
              {payload?.address && (
                <div className="text-sm text-gray-700 mb-1">
                  <div className="font-medium">Address:</div>
                  <div className="text-xs text-gray-500">
                    {payload.address.street && `${payload.address.street}, `}
                    {payload.address.city && `${payload.address.city}, `}
                    {payload.address.state && `${payload.address.state} `}
                    {payload.address.zip && payload.address.zip}
                  </div>
                </div>
              )}

              {/* Location history count - clickable to expand */}
              {payload?.locationHistory && payload.locationHistory.length > 0 && (
                <div className="text-xs text-gray-500">
                  <button
                    onClick={() => setShowLocationHistory(!showLocationHistory)}
                    className="text-[#1dd1f5] hover:text-[#014463] underline cursor-pointer"
                  >
                    {payload.locationHistory.length} location{payload.locationHistory.length !== 1 ? 's' : ''} recorded
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              {isTracking ? 
                'GPS tracking active - coordinates updating in real-time' :
                'You can now drop a pin on the map or continue with address search.'
              }
            </div>
          </div>
        )}

        {/* Expandable Location History - Real-time Updates */}
        {showLocationHistory && payload?.locationHistory && payload.locationHistory.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Location History</div>
              {isTracking && (
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {payload.locationHistory?.map((entry, index) => {
                const isLatest = index === (payload.locationHistory?.length || 0) - 1 && isTracking;
                return (
                  <div key={index} className={`text-xs p-2 rounded border ${
                    isLatest ? 'bg-green-50 border-green-200' : 'bg-white/20 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-gray-600">
                        {entry.coords?.lat !== undefined && entry.coords?.lng !== undefined ? 
                          `${entry.coords.lat.toFixed(6)}, ${entry.coords.lng.toFixed(6)}` :
                          'Invalid coordinates'
                        }
                      </div>
                      {isLatest && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">CURRENT</span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    {entry.address && (
                      <div className="text-gray-500 truncate">
                        {entry.address.street && `${entry.address.street}, `}
                        {entry.address.city && `${entry.address.city}, `}
                        {entry.address.state && `${entry.address.state} `}
                        {entry.address.zip && entry.address.zip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
