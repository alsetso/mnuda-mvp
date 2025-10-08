'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/features/session/components/AppHeader';
// import NodeStack from '@/features/nodes/components/NodeStack'; // Unused
import SessionResultsPanel from '@/features/session/components/SessionResultsPanel';
import { useMap } from '@/features/map/hooks/useMap';
import { useAddressSync } from '@/features/map/hooks/useAddressSync';
import { useUserLocationTracker } from '@/features/map/hooks/useUserLocationTracker';
import { useSkipTracePins } from '@/features/map/hooks/useSkipTracePins';
import { usePropertyPanel } from '@/features/map/hooks/usePropertyPanel';
import { PropertyPanel } from '@/features/map/components/PropertyPanel';
import { FloatingSearchInput } from '@/features/map/components/FloatingSearchInput';
import { Address, MapboxFeature, PropertyDetails, PropertyPerson } from '@/features/map/types';
import { AddressParser as AddressParserService } from '@/features/map/services/addressParser';
import { minnesotaBoundsService } from '@/features/map/services/minnesotaBoundsService';
import { useSessionManager, SessionOverlay, useApiUsageContext } from '@/features/session';
import { apiUsageService } from '@/features/session/services/apiUsageService';
import { useToast } from '@/features/ui/hooks/useToast';
import { NodeData, sessionStorageService } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { apiService, CreditsExhaustedError } from '@/features/api/services/apiService';
import { WeatherDialog } from '@/features/weather';
// import { GeocodingService } from '@/features/map/services/geocodingService';
import { AddressService } from '@/features/api/services/addressService';
import { personDetailParseService } from '@/features/api/services/personDetailParse';

/**
 * MapPage (Refactored)
 * - Uses improved useMap + useUserLocationTracker
 * - Unified marker management & popup support
 * - Streamlined banners + tracking FAB
 * - Session-safe UserFound node lifecycle
 */

type Coords = { lat: number; lng: number };
type UserFoundLifecycle = 'idle' | 'locating' | 'active' | 'completed';

function MapPageContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- UI state ---
  const [mobileView, setMobileView] = useState<'map' | 'results'>('map'); // Mobile view toggle
  const { withApiToast } = useToast();
  const { showCreditsModal } = useApiUsageContext();

  // --- Property panel ---
  const {
    property,
    isVisible: isPropertyPanelVisible,
    showProperty,
    hideProperty
    // onPersonClick: handlePropertyPersonClick // Unused
  } = usePropertyPanel();

  // Handle person clicks from property panel
  const handlePropertyPersonClickWrapper = useCallback((person: PropertyPerson) => {
    // For now, just log the person click
    // In the future, this could open a person modal or trigger a trace
    console.log('Property person clicked:', person);
    
    // You could also trigger a person trace here if needed
    // handlePersonTrace(person.id, person, 'Property Panel', undefined, person.id, person);
  }, []);

  // Handle search completion
  const handleSearchComplete = useCallback((address: Address) => {
    console.log('Search completed:', address);
    // The search input already handles creating the search history node
    // and flying to the location, so we just need to log it here
  }, []);

  // --- Session manager ---
  const {
    currentSession,
    sessions,
    createNewSession,
    switchSession,
    renameSession,
    addNode,
    deleteNode,
  } = useSessionManager();

  // --- User location tracker ---
  const {
    userLocation,
    isTracking,
    locationHistory,
    error: locationError,
    startTracking,
    stopTracking,
  } = useUserLocationTracker({ pollIntervalMs: 0, historyLimit: 200 });

  // --- Map ---
  const {
    mapLoaded,
    addAddressPin,
    removeAddressPin,
    flyTo,
    updateUserLocation,
    addMarker,
    removeMarker,
    updateMarkerPopup
    // showPropertyDetails, // Unused
  } = useMap({
    mapContainer,
    onMapReady: (mapInstance) => console.log('Map ready:', mapInstance),
    onMapClick: async (coordinates) => {
      // Check if coordinates are within Minnesota bounds for all clicks
      if (!minnesotaBoundsService.isWithinMinnesota(coordinates)) {
        await withApiToast('Minnesota Only', () => Promise.reject('This location is not in Minnesota. Please click within Minnesota state boundaries to perform skip tracing operations.'), {
          errorMessage: 'Not in Minnesota',
        });
        return;
      }
      
      if (!currentSession) {
        const result = await onMapPinDropped(coordinates);
        // Handle any errors from address sync (like non-Minnesota addresses)
        if (result && !result.success && result.error) {
          await withApiToast('Minnesota Only', () => Promise.reject('This location is not in Minnesota. Please click within Minnesota state boundaries to perform skip tracing operations.'), {
            errorMessage: 'Not in Minnesota',
          });
        }
      } else {
        await handleMapClickWithSession(coordinates);
      }
    },
    onPropertyClick: (property) => {
      showProperty(property);
    },
  });

  // --- Address sync (temporary vs session) ---
  const {
    temporaryAddress: selectedAddress,
    isSyncing: isSearching,
    onMapPinDropped,
  } = useAddressSync({
    onTemporaryAddressChange: (address) => console.log('Temp address changed:', address),
    onAddressPinUpdate: (coordinates) => {
      if (coordinates) addAddressPin(coordinates);
      else removeAddressPin();
    },
    onMapFlyTo: (coordinates, zoom) => flyTo(coordinates, zoom),
  });

  // --- Skip trace pins (moved after handlePersonTrace is defined) ---

  // --- UserFound node lifecycle ---
  const [userFoundState, setUserFoundState] = useState<UserFoundLifecycle>('idle');

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatAddress = useCallback((address: Address) => {
    const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
    return parts.join(', ');
  }, []);

  const parseMapboxAddress = useCallback(
    (feature: MapboxFeature): Pick<Address, 'street' | 'city' | 'state' | 'zip'> =>
      AddressParserService.parseMapboxFeature(feature),
    []
  );


  const handleSessionSwitch = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      // Update URL with the new session ID
      router.push(`/map?session=${sessionId}`);
    },
    [switchSession, router]
  );

  // Handle URL parameter changes for session switching
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && currentSession?.id !== sessionId) {
      // Check if the session exists in our sessions list
      const sessionExists = sessions.some(session => session.id === sessionId);
      if (sessionExists) {
        switchSession(sessionId);
      }
    }
  }, [searchParams, currentSession?.id, sessions, switchSession]);

  // Session overlay disabled - allow access without session selection
  const shouldShowSessionOverlay = false;


  // ---------------------------------------------------------------------------
  // UserFound node lifecycle
  // ---------------------------------------------------------------------------
  const handleUserFoundLocationFound = useCallback(
    (nodeId: string, coords: Coords, address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } }) => {
      sessionStorageService.updateUserFoundNode(nodeId, coords, address);
    },
    []
  );

  const completeActiveUserFoundNode = useCallback(() => {
    if (!currentSession) return;
    const node = currentSession.nodes.find(
      (n: NodeData) => n.type === 'userFound' && !n.hasCompleted
    );
    if (node) {
      sessionStorageService.completeUserFoundNode(node.id);
    }
  }, [currentSession]);

  const handleUserFoundStartTracking = useCallback(() => {
    setUserFoundState('locating');
    startTracking();
  }, [startTracking]);

  const handleUserFoundStopTracking = useCallback(() => {
    stopTracking();
    completeActiveUserFoundNode();
    setUserFoundState('completed');
  }, [stopTracking, completeActiveUserFoundNode]);

  // const handleCreateNewLocationSession = useCallback(() => {
  //   if (!currentSession) return;
  //   const node = sessionStorageService.createNewUserFoundNode();
  //   if (node) {
  //     addNode(node);
  //     setUserFoundState('idle');
  //   }
  // }, [currentSession, addNode]);

  // Track lifecycle when new location arrives
  useEffect(() => {
    if (!currentSession || !userLocation) return;
  
    const activeUserNode = currentSession.nodes.find(
      (n: NodeData) => n.type === 'userFound' && !n.hasCompleted
    );
  
    if (activeUserNode) {
      // Push live coordinates into the active UserFound node
      handleUserFoundLocationFound(activeUserNode.id, {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
  
      // Flip lifecycle to "active" once we have the first fix
      if (userFoundState === 'locating') {
        setUserFoundState('active');
      }
    }
  
    // Always keep the map marker updated
    updateUserLocation(userLocation);
    
    // Fly to user location when tracking is active
    if (isTracking) {
      flyTo({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
  }, [
    userLocation,
    currentSession,
    userFoundState,
    handleUserFoundLocationFound,
    updateUserLocation,
    isTracking,
    flyTo,
  ]);


  // Handle person clicks from skip trace pin popups (moved after handlePersonTrace is defined)
  
  // ---------------------------------------------------------------------------
  // Map click with session → reverse geocode → Address Intel node
  // ---------------------------------------------------------------------------
  const handleMapClickWithSession = useCallback(
    async (coordinates: Coords) => {
      if (!currentSession) return;
      
      // Check credits before making any API calls
      if (!apiUsageService.canMakeRequest()) {
        showCreditsModal();
        return;
      }
      
      // First, get the address to check if it's in Minnesota
      let address: Address;
      try {
        addAddressPin(coordinates);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&types=address&limit=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Reverse geocode failed');
        const data = await res.json();
        if (!data?.features?.length) throw new Error('No address found');

        // Log the response for debugging
        console.log('Mapbox reverse geocoding response:', data);
        
        const feature = data.features[0]; // Take the first (most relevant) result
        const { street, city, state, zip } = parseMapboxAddress(feature);

        // Secondary check: Validate that the address state is actually Minnesota
        if (!minnesotaBoundsService.isMinnesotaState(state)) {
          // Handle Minnesota bounds check outside of try-catch to avoid console errors
          await withApiToast('Minnesota Only', () => Promise.reject('This location is not in Minnesota. Please click within Minnesota state boundaries to perform skip tracing operations.'), {
            errorMessage: 'Not in Minnesota',
          });
          return;
        }

        address = {
          street: street || 'Unknown',
          city: city || 'Unknown',
          state: state || 'Unknown',
          zip: zip || '',
          coordinates: { latitude: coordinates.lat, longitude: coordinates.lng },
        };
      } catch (err) {
        console.error('Map click error:', err);
        if (err instanceof CreditsExhaustedError) {
          showCreditsModal();
          return;
        }
        await withApiToast('Error', () => Promise.reject(err as Error), {
          errorMessage: 'Failed to resolve address',
        });
        return;
      }

      // Now proceed with the address service call
      try {
        console.log('Map click - Calling AddressService with address:', address);
        const result = await AddressService.searchAddressWithToast(
          address,
          currentSession.id,
          withApiToast
        );
        console.log('Map click - AddressService result:', result);
        if (result.success && result.node) {
          console.log('Map click - Adding node:', result.node);
          addNode(result.node);
          
          // Show property details in the property panel
          if (result.node.response && typeof result.node.response === 'object' && result.node.response !== null && 'people' in result.node.response && Array.isArray(result.node.response.people)) {
            const people = result.node.response.people as Array<{
              id?: string;
              name?: string;
              age?: number;
              relationship?: string;
            }>;
            const propertyDetails: PropertyDetails = {
              address: address.street,
              city: address.city,
              state: address.state,
              zip: address.zip,
              ownerCount: people.length,
              people: people.map((person, index: number) => ({
                id: person.id || `person-${index}`,
                name: person.name || 'Unknown',
                age: person.age,
                relationship: person.relationship || 'Property Owner'
              }))
            };
            showProperty(propertyDetails);
          }
        } else {
          console.warn('Map click - AddressService failed or no node returned:', result);
        }
      } catch (err) {
        console.error('Map click error:', err);
        if (err instanceof CreditsExhaustedError) {
          showCreditsModal();
          return;
        }
        await withApiToast('Error', () => Promise.reject(err as Error), {
          errorMessage: 'Failed to resolve address',
        });
      }
    },
    [currentSession, addNode, addAddressPin, withApiToast, parseMapboxAddress, showCreditsModal, showProperty]
  );

  // ---------------------------------------------------------------------------
  // Node actions
  // ---------------------------------------------------------------------------
  const handlePersonTrace = useCallback(
    async (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => {
      if (!currentSession) return;
      
      // If personData is already provided (from EntityModal), use it instead of making another API call
      if (personData) {
        try {
          // Parse the existing response using the person detail parser
          const parsedData = personDetailParseService.parsePersonDetailResponse(personData as Record<string, unknown>, parentNodeId || currentSession.id);
          
          const node: NodeData = {
            id: `person-${Date.now()}`,
            type: 'people-result',
            personId: personId,
            personData: parsedData,
            apiName: apiName,
            timestamp: Date.now(),
            mnNodeId: MnudaIdService.generateTypedId('node'),
            parentNodeId: parentNodeId,
            clickedEntityId: entityId,
            clickedEntityData: entityData,
          };
          addNode(node);
          return;
        } catch (err) {
          console.error('Error parsing existing person data:', err);
          // Fall through to make a new API call if parsing fails
        }
      }

      // Only make API call if no personData was provided or parsing failed
      // Check credits before making any API calls
      if (!apiUsageService.canMakeRequest()) {
        showCreditsModal();
        return;
      }
      try {
        const resp = await withApiToast(
          'Person Trace',
          () => apiService.callPersonAPI(personId),
          {
            loadingMessage: `Tracing person: ${personId}`,
            successMessage: 'Person details retrieved successfully',
            errorMessage: 'Failed to retrieve person details',
          }
        );
        
        // Parse the response using the person detail parser
        const parsedData = personDetailParseService.parsePersonDetailResponse(resp as Record<string, unknown>, parentNodeId || currentSession.id);
        
        const node: NodeData = {
          id: `person-${Date.now()}`,
          type: 'people-result',
          personId: personId,
          personData: parsedData,
          apiName: apiName,
          timestamp: Date.now(),
          mnNodeId: MnudaIdService.generateTypedId('node'),
          parentNodeId: parentNodeId,
          clickedEntityId: entityId,
          clickedEntityData: entityData,
        };
        addNode(node);
      } catch (err) {
        console.error('Person trace error:', err);
        
        // Check if it's a credits exhausted error
        if (err instanceof CreditsExhaustedError) {
          showCreditsModal();
          return;
        }
        
        // Check if it's a rate limit error
        if (err instanceof Error && err.message.includes('rate limit')) {
          console.error('Rate limit exceeded, not creating person detail node');
          return;
        }
        
        // Fallback to mock data for other API failures
        const mockPersonData = {
          entities: [],
          totalEntities: 0,
          entityCounts: {
            properties: 0,
            addresses: 0,
            phones: 0,
            emails: 0,
            persons: 0,
            images: 0,
          },
          rawResponse: {},
          source: 'Mock Data (API Failed)'
        };
        
        const node: NodeData = {
          id: `person-${Date.now()}`,
          type: 'people-result',
          personId: personId,
          personData: mockPersonData,
          apiName: apiName,
          timestamp: Date.now(),
          mnNodeId: MnudaIdService.generateTypedId('node'),
          parentNodeId: parentNodeId,
          clickedEntityId: entityId,
          clickedEntityData: entityData,
        };
        addNode(node);
      }
    },
    [currentSession, addNode, withApiToast, showCreditsModal]
  );

  // --- Skip trace pins ---
  const {
  } = useSkipTracePins({
    nodes: currentSession?.nodes || [],
    addMarker,
    removeMarker,
    mapLoaded,
    onPersonTrace: handlePersonTrace,
    updateMarkerPopup,
    sessionId: currentSession?.id,
  });

  // Handle person clicks from skip trace pin popups
  useEffect(() => {
    const handlePersonClick = (event: CustomEvent) => {
      const { person } = event.detail;
      if (person && person.apiPersonId) {
        // Call the person trace handler with the API person ID
        handlePersonTrace(
          person.apiPersonId, // Use the external API ID, not the internal entity ID
          person,
          'Skip Trace',
          undefined,
          person.mnEntityId,
          person
        );
      } else {
        console.warn('Person clicked but no apiPersonId available:', person);
      }
    };

    const handleChildResultClick = (event: CustomEvent) => {
      // PersonModal functionality removed - child result clicks are now handled inline
      console.log('Child result clicked:', event.detail);
    };

    document.addEventListener('personClick', handlePersonClick as EventListener);
    document.addEventListener('childResultClick', handleChildResultClick as EventListener);
    return () => {
      document.removeEventListener('personClick', handlePersonClick as EventListener);
      document.removeEventListener('childResultClick', handleChildResultClick as EventListener);
    };
  }, [handlePersonTrace]);

  // const handleAddressIntel = useCallback(
  //   async (address: { street: string; city: string; state: string; zip: string }) => {
  //     if (!currentSession) return;
  //     try {
  //       const geo = await GeocodingService.geocodeAddress(address);
  //       const full = { ...address, coordinates: geo.success ? geo.coordinates : undefined };
  //       const resp = await withApiToast(
  //         'Address Intel',
  //         () => apiService.callSkipTraceAPI(address),
  //         {
  //           loadingMessage: `Analyzing ${address.street}, ${address.city}`,
  //           successMessage: 'Intel complete',
  //           errorMessage: 'Intel failed',
  //         }
  //       );
  //       const node: NodeData = {
  //         id: `addr-${Date.now()}`,
  //         type: 'api-result',
  //         address: full as Address,
  //         apiName: 'Address Intel',
  //         response: resp,
  //         timestamp: Date.now(),
  //         mnNodeId: MnudaIdService.generateTypedId('node'),
  //       };
  //       addNode(node);
  //     } catch (err) {
  //       console.error('Intel error:', err);
  //     }
  //   },
  //   [currentSession, addNode, withApiToast]
  // );

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

  const StatusBanner = () => {
    if (!mapLoaded) return <Banner className="bg-gray-100"><Spinner /><span>Loading map…</span></Banner>;
    if (locationError) return <Banner className="bg-red-500 text-white">⚠ {locationError}</Banner>;
    if (isSearching) return <Banner className="bg-blue-500 text-white"><Spinner small />Searching address…</Banner>;
    return null;
  };




  const TrackingFab = () => {
    const active = isTracking || userFoundState === 'active' || userFoundState === 'locating';
    return (
      <button
        onClick={active ? handleUserFoundStopTracking : handleUserFoundStartTracking}
        className={`absolute top-4 left-4 z-20 rounded-lg px-3 py-2 shadow-lg font-medium flex items-center space-x-2 text-sm ${
          active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#014463] hover:bg-[#1dd1f5] text-white'
        }`}
      >
        <IconTarget />
        <span>{active ? 'Stop' : 'Find Me'}</span>
      </button>
    );
  };


  const AddressCard = ({ title, address }: { title: string; address: Address }) => (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
      <div className="text-sm font-medium text-gray-900 mb-1">{title}</div>
      <div className="text-xs text-gray-600">{formatAddress(address)}</div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0">
        <AppHeader
          currentSession={currentSession}
          sessions={sessions}
          onNewSession={createNewSession}
          onSessionSwitch={handleSessionSwitch}
          onSessionRename={renameSession}
          updateUrl={true}
          showSessionSelector={true}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map - 50% width on desktop, full width on mobile when selected */}
        <div className={`flex-1 min-w-0 relative ${mobileView === 'results' ? 'hidden md:block' : ''}`}>
          <div ref={mapContainer} className="w-full h-full" />

          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10"><StatusBanner /></div>
          {selectedAddress && !currentSession && <AddressCard title="Selected" address={selectedAddress} />}
          
          {/* Floating Search Input */}
          <FloatingSearchInput 
            onSearchComplete={handleSearchComplete} 
            onFlyTo={flyTo}
            currentSession={currentSession}
            onAddNode={(node: unknown) => addNode(node as NodeData)}
          />
          
          <TrackingFab />

          {/* Weather Dialog - Bottom Left, adjusted for mobile toggle */}
          <div className="absolute bottom-16 left-4 z-20 md:bottom-4 md:left-4">
            <WeatherDialog userLocation={userLocation} />
          </div>

          {/* Live location coordinates overlay - hidden for cleaner UI */}
          {false && userLocation && (isTracking || userFoundState === 'active') && (
            <div className="absolute bottom-4 left-4 z-20 bg-white border border-gray-200 rounded-md shadow px-3 py-2 text-xs text-gray-700">
              <div className="font-medium mb-0.5">Live Location</div>
              <div>lat: {userLocation?.latitude.toFixed(6)} • lng: {userLocation?.longitude.toFixed(6)}</div>
              <div className="opacity-70">pts: {locationHistory.length}</div>
            </div>
          )}
        </div>

        {/* Session Results Panel - Two-state interface */}
        <SessionResultsPanel
          currentSession={currentSession}
          onPersonTrace={handlePersonTrace}
          onDeleteNode={deleteNode}
          onAddNode={addNode}
          mobileView={mobileView}
        />
      </div>

      {/* Mobile Toggle Button - Only visible on mobile */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1">
          <div className="flex">
            <button
              onClick={() => setMobileView('map')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mobileView === 'map'
                  ? 'bg-[#014463] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Map</span>
            </button>
            <button
              onClick={() => setMobileView('results')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mobileView === 'results'
                  ? 'bg-[#014463] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Results</span>
            </button>
          </div>
        </div>
      </div>


      {/* Property Panel */}
      <PropertyPanel
        property={property}
        isVisible={isPropertyPanelVisible}
        onClose={hideProperty}
        onPersonClick={handlePropertyPersonClickWrapper}
      />

      {/* Session Overlay */}
      <SessionOverlay
        isOpen={shouldShowSessionOverlay}
        sessions={sessions}
        onSessionSelect={handleSessionSwitch}
        onCreateNewSession={createNewSession}
      />
    </div>
  );
}

/* ------------------------- UI subcomponents ------------------------- */

function Banner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2 ${className}`}>
      {children}
    </div>
  );
}
function Spinner({ small = false }: { small?: boolean }) {
  const size = small ? 'h-4 w-4' : 'h-8 w-8';
  return <div className={`animate-spin rounded-full ${size} border-b-2 border-current`} />;
}
function IconTarget() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v0m0 12v0m6-6v0M6 12v0m6-9a9 9 0 100 18 9 9 0 000-18z" />
    </svg>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading map...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
