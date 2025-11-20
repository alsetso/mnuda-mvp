'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMap } from '@/features/map/hooks/useMap';
import OnboardingDebugWidget from '@/components/OnboardingDebugWidget';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';

export function OnboardingMapContainer() {
  const router = useRouter();
  const { selectedProfile } = useProfile();
  const mapContainer = useRef<HTMLDivElement>(null);
  const onboardingMapClickHandlerRef = useRef<((coordinates: { lat: number; lng: number }) => void) | null>(null);

  const {
    map,
    mapLoaded,
    mapInfo,
    addMarker,
    removeMarker,
    flyTo,
  } = useMap({
    mapContainer,
    onMapReady: () => {
      // Map is ready
    },
    onMapClick: (coordinates) => {
      // Handle onboarding map clicks
      if (onboardingMapClickHandlerRef.current) {
        onboardingMapClickHandlerRef.current(coordinates);
      }
    },
  });

  const handleFlyTo = (coordinates: { lat: number; lng: number }, zoom?: number) => {
    if (map) {
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: zoom || 15,
        duration: 1500,
      });
    }
  };

  // Redirect if no profile or already onboarded
  useEffect(() => {
    if (!selectedProfile) {
      router.replace('/account/profiles');
      return;
    }
    if (selectedProfile.onboarded) {
      router.replace('/map');
      return;
    }
  }, [selectedProfile, router]);

  if (!selectedProfile || selectedProfile.onboarded) {
    return null;
  }

  const profileTypeLabel = selectedProfile.profile_type.replace(/_/g, ' ');

  return (
    <div className="h-[calc(100vh-3rem)] w-full overflow-hidden relative border-2 border-gold-600" style={{ margin: 0, padding: 0 }}>
      {/* Gold label - touches top border, rounded bottom corners only */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center">
        <span className="text-[8px] font-semibold text-white bg-gold-600 px-3 py-2 rounded-bl-lg rounded-br-lg">Onboarding Map</span>
      </div>

      {/* Upper left text - large screens only */}
      <div className="hidden lg:block absolute top-4 left-4 z-50">
        <div className="text-white">
          <p className="text-sm font-semibold">Complete your {profileTypeLabel} onboarding.</p>
          <p className="text-sm mt-1">Hello, {selectedProfile.username}</p>
        </div>
      </div>

      {/* Simple Map Container - No pins, no draw, no other services */}
      <div 
        ref={mapContainer} 
        className="absolute w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%', 
          margin: 0, 
          padding: 0, 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />

      {/* Onboarding Widget */}
      <OnboardingDebugWidget 
        onFlyTo={handleFlyTo}
        onSetMapClickHandler={(handler) => {
          onboardingMapClickHandlerRef.current = handler;
        }}
        addMarker={addMarker}
        removeMarker={removeMarker}
        getMapCenter={() => {
          if (map && mapInfo) {
            return { lat: mapInfo.center.lat, lng: mapInfo.center.lng };
          }
          return null;
        }}
        map={map}
      />
    </div>
  );
}

