'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '@/features/session/components/AppHeader';
import MapNodeStackPanel from '@/features/map/components/MapNodeStackPanel';
import { useMap } from '@/features/map/hooks/useMap';
import { useAddressSync } from '@/features/map/hooks/useAddressSync';
import { useUserLocationTracker } from '@/features/map/hooks/useUserLocationTracker';
import { Address, MapboxFeature } from '@/features/map/types';
import { AddressParser as AddressParserService } from '@/features/map/services/addressParser';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import { useToast } from '@/features/ui/hooks/useToast';
import { NodeData, sessionStorageService } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { apiService } from '@/features/api/services/apiService';
import { GeocodingService } from '@/features/map/services/geocodingService';
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

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);

  // --- UI state ---
  const [mobileView, setMobileView] = useState<'map' | 'results'>('map');
  const { withApiToast } = useToast();

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
    lastUpdated,
    refreshCount,
  } = useUserLocationTracker({ pollIntervalMs: 0, historyLimit: 200 });

  // --- Map ---
  const {
    mapLoaded,
    addAddressPin,
    removeAddressPin,
    flyTo,
    updateUserLocation,
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
    onStartNodeAddressChanged,
  } = useAddressSync({
    onTemporaryAddressChange: (address) => console.log('Temp address changed:', address),
    onAddressPinUpdate: (coordinates) => {
      if (coordinates) addAddressPin(coordinates);
      else removeAddressPin();
    },
    onMapFlyTo: (coordinates, zoom) => flyTo(coordinates, zoom),
  });

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

  const handleCreateNewLocationSession = useCallback(() => {
    if (!currentSession) return;
    const node = sessionStorageService.createNewUserFoundNode();
    if (node) {
      addNode(node);
      setUserFoundState('idle');
    }
  }, [currentSession, addNode]);

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

  const handleAddressIntel = useCallback(
    async (address: { street: string; city: string; state: string; zip: string }) => {
      if (!currentSession) return;
      try {
        const geo = await GeocodingService.geocodeAddress(address);
        const full = { ...address, coordinates: geo.success ? geo.coordinates : undefined };
        const resp = await withApiToast(
          'Address Intel',
          () => apiService.callSkipTraceAPI(address),
          {
            loadingMessage: `Analyzing ${address.street}, ${address.city}`,
            successMessage: 'Intel complete',
            errorMessage: 'Intel failed',
          }
        );
        const node: NodeData = {
          id: `addr-${Date.now()}`,
          type: 'api-result',
          address: full as Address,
          apiName: 'Address Intel',
          response: resp,
          timestamp: Date.now(),
          mnNodeId: MnudaIdService.generateTypedId('node'),
        };
        addNode(node);
      } catch (err) {
        console.error('Intel error:', err);
      }
    },
    [currentSession, addNode, withApiToast]
  );

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
  const handleMobileViewToggle = () =>
    setMobileView((prev) => (prev === 'map' ? 'results' : 'map'));

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
        <span>{active ? 'Stop Tracking' : 'Find Me'}</span>
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
          updateUrl
          showSessionSelector
          showMobileToggle
          mobileView={mobileView}
          onMobileViewToggle={handleMobileViewToggle}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className={`flex-1 min-w-0 relative ${mobileView === 'results' ? 'hidden md:block' : ''}`}>
          <div ref={mapContainer} className="w-full h-full" />

          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10"><StatusBanner /></div>
          {selectedAddress && !currentSession && <AddressCard title="Selected" address={selectedAddress} />}
          <TrackingFab />

          {userLocation && (isTracking || userFoundState === 'active') && (
            <div className="absolute bottom-4 left-4 z-20 bg-white border border-gray-200 rounded-md shadow px-3 py-2 text-xs text-gray-700">
              <div className="font-medium mb-0.5">Live Location</div>
              <div>lat: {userLocation.latitude.toFixed(6)} • lng: {userLocation.longitude.toFixed(6)}</div>
              <div className="opacity-70">pts: {locationHistory.length}</div>
            </div>
          )}
        </div>

        {/* Right Panel (desktop) */}
        <div className="flex-1 min-w-0 border-l border-gray-200 bg-gray-50 flex-col hidden md:flex">
          {currentSession && (
            <MapNodeStackPanel
              currentSession={currentSession}
            onPersonTrace={handlePersonTrace}
            onAddressIntel={handleAddressIntel}
            onStartNodeComplete={(id) => console.log('Start node complete', id)}
            onDeleteNode={deleteNode}
            onAddNode={addNode}
            onRenameSession={renameSession}
            onStartNodeAddressChanged={onStartNodeAddressChanged}
            onUserFoundLocationFound={handleUserFoundLocationFound}
            onUserFoundStartTracking={handleUserFoundStartTracking}
            onUserFoundStopTracking={handleUserFoundStopTracking}
            onCreateNewLocationSession={handleCreateNewLocationSession}
            isTracking={isTracking}
            userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
            lastUpdated={lastUpdated}
            refreshCount={refreshCount}
            />
          )}
        </div>

        {/* Mobile results */}
        <div className={`md:hidden flex-1 min-w-0 border-l border-gray-200 bg-gray-50 ${mobileView === 'results' ? 'flex' : 'hidden'}`}>
          {currentSession && (
            <MapNodeStackPanel
              currentSession={currentSession}
            onPersonTrace={handlePersonTrace}
            onAddressIntel={handleAddressIntel}
            onStartNodeComplete={(id) => console.log('Start node complete', id)}
            onDeleteNode={deleteNode}
            onAddNode={addNode}
            onRenameSession={renameSession}
            onStartNodeAddressChanged={onStartNodeAddressChanged}
            onUserFoundLocationFound={handleUserFoundLocationFound}
            onUserFoundStartTracking={handleUserFoundStartTracking}
            onUserFoundStopTracking={handleUserFoundStopTracking}
            onCreateNewLocationSession={handleCreateNewLocationSession}
            isTracking={isTracking}
            userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
            lastUpdated={lastUpdated}
            refreshCount={refreshCount}
            />
          )}
        </div>
      </div>
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
