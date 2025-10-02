'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/features/session/components/AppHeader';
import PersonModal from '@/features/nodes/components/PersonModal';
import SkipTracePinsList from '@/features/map/components/SkipTracePinsList';
import { useMap } from '@/features/map/hooks/useMap';
import { useAddressSync } from '@/features/map/hooks/useAddressSync';
import { useUserLocationTracker } from '@/features/map/hooks/useUserLocationTracker';
import { useSkipTracePins } from '@/features/map/hooks/useSkipTracePins';
import { Address, MapboxFeature } from '@/features/map/types';
import { AddressParser as AddressParserService } from '@/features/map/services/addressParser';
import { useSessionManager, SessionOverlay } from '@/features/session';
import { useToast } from '@/features/ui/hooks/useToast';
import { NodeData, sessionStorageService } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { apiService } from '@/features/api/services/apiService';
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

  // --- UI state ---
  const [isSkipTraceSidebarOpen, setIsSkipTraceSidebarOpen] = useState(true); // Skip trace sidebar state - start open
  const [selectedPersonNode, setSelectedPersonNode] = useState<NodeData | null>(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const { withApiToast } = useToast();

  // --- Session manager ---
  const {
    currentSession,
    sessions,
    createNewSession,
    switchSession,
    renameSession,
    addNode,
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
    updateMarkerPopup,
    map,
  } = useMap({
    mapContainer,
    onMapReady: (mapInstance) => console.log('Map ready:', mapInstance),
    onMapClick: async (coordinates) => {
      if (!currentSession) {
        await onMapPinDropped(coordinates);
      } else {
        await handleMapClickWithSession(coordinates);
      }
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
    },
    [switchSession]
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

  // Show session overlay when no session is selected
  const shouldShowSessionOverlay = !currentSession;


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

  // Handle map resize when sidebar visibility changes
  useEffect(() => {
    if (map && mapLoaded) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        map.resize();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [map, mapLoaded]);

  // Handle person clicks from skip trace pin popups (moved after handlePersonTrace is defined)
  
  // ---------------------------------------------------------------------------
  // Map click with session → reverse geocode → Address Intel node
  // ---------------------------------------------------------------------------
  const handleMapClickWithSession = useCallback(
    async (coordinates: Coords) => {
      if (!currentSession) return;
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

        const address: Address = {
          street: street || 'Unknown',
          city: city || 'Unknown',
          state: state || 'Unknown',
          zip: zip || '',
          coordinates: { latitude: coordinates.lat, longitude: coordinates.lng },
        };

        const result = await AddressService.searchAddressWithToast(
          address,
          currentSession.id,
          withApiToast
        );
        if (result.success && result.node) addNode(result.node);
      } catch (err) {
        console.error('Map click error:', err);
        await withApiToast('Error', () => Promise.reject(err as Error), {
          errorMessage: 'Failed to resolve address',
        });
      }
    },
    [currentSession, addNode, addAddressPin, withApiToast, parseMapboxAddress]
  );

  // ---------------------------------------------------------------------------
  // Node actions
  // ---------------------------------------------------------------------------
  const handlePersonTrace = useCallback(
    async (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => {
      if (!currentSession) return;
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
    [currentSession, addNode, withApiToast]
  );

  // --- Skip trace pins ---
  const {
    skipTraceAddresses,
    isLoading: isSkipTracePinsLoading,
  } = useSkipTracePins({
    nodes: currentSession?.nodes || [],
    addMarker,
    removeMarker,
    mapLoaded,
    onPersonTrace: handlePersonTrace,
    updateMarkerPopup,
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
      const { childNode } = event.detail;
      if (childNode) {
        setSelectedPersonNode(childNode);
        setIsPersonModalOpen(true);
      }
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
  const handleSkipTraceSidebarToggle = () =>
    setIsSkipTraceSidebarOpen((prev) => !prev);

  const handleSkipTraceAddressClick = useCallback((address: { coordinates?: { latitude: number; longitude: number } }) => {
    if (address.coordinates) {
      // Close sidebar on mobile after click for better UX
      if (window.innerWidth < 768) {
        setIsSkipTraceSidebarOpen(false);
      }
      
      // Fly to location
      flyTo({
        lat: address.coordinates.latitude,
        lng: address.coordinates.longitude
      });
    }
  }, [flyTo]);

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
        className={`absolute bottom-4 right-4 z-20 rounded-full px-5 py-3 shadow-lg font-semibold flex items-center space-x-2 ${
          active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
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
          showMobileToggle={false}
          showSidebarToggle={false}
          showSkipTraceToggle={true}
          isSkipTraceSidebarOpen={isSkipTraceSidebarOpen}
          onSkipTraceSidebarToggle={handleSkipTraceSidebarToggle}
          skipTracePinsCount={skipTraceAddresses.length}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop overlay */}
        {isSkipTraceSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSkipTraceSidebarOpen(false)}
          />
        )}

        {/* Skip Trace Sidebar */}
        {isSkipTraceSidebarOpen && (
          <div className={`
            fixed md:relative top-14 md:top-auto inset-x-0 md:inset-x-auto bottom-0 md:bottom-auto z-50 md:z-auto
            w-full md:w-80 md:flex-shrink-0
            bg-white md:bg-white
            border-r border-gray-200
            transform md:transform-none
            transition-transform duration-300 ease-in-out
            ${isSkipTraceSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            flex flex-col
          `}>
            <SkipTracePinsList
              skipTraceAddresses={skipTraceAddresses}
              isLoading={isSkipTracePinsLoading}
              nodes={currentSession?.nodes || []}
              onAddressClick={handleSkipTraceAddressClick}
              currentSession={currentSession}
              sessions={sessions}
              onNewSession={createNewSession}
              onSessionSwitch={handleSessionSwitch}
              onClose={() => setIsSkipTraceSidebarOpen(false)}
            />
          </div>
        )}

        {/* Map - Full width, no right sidebar */}
        <div className="flex-1 min-w-0 relative">
          <div ref={mapContainer} className="w-full h-full" />

          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10"><StatusBanner /></div>
          {selectedAddress && !currentSession && <AddressCard title="Selected" address={selectedAddress} />}
          
          
          <TrackingFab />

          {/* Live location coordinates overlay - hidden for cleaner UI */}
          {false && userLocation && (isTracking || userFoundState === 'active') && (
            <div className="absolute bottom-4 left-4 z-20 bg-white border border-gray-200 rounded-md shadow px-3 py-2 text-xs text-gray-700">
              <div className="font-medium mb-0.5">Live Location</div>
              <div>lat: {userLocation?.latitude.toFixed(6)} • lng: {userLocation?.longitude.toFixed(6)}</div>
              <div className="opacity-70">pts: {locationHistory.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* Person Modal */}
      {selectedPersonNode && (
        <PersonModal
          isOpen={isPersonModalOpen}
          onClose={() => {
            setIsPersonModalOpen(false);
            setSelectedPersonNode(null);
          }}
          personNode={selectedPersonNode}
        />
      )}

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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
