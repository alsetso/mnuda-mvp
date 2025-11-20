'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import { MyHomesService, MyHome, CreateMyHomeData, UpdateMyHomeData } from '@/features/my-homes/services/myHomesService';
import { useMap } from '@/features/map/hooks/useMap';
import { useToast } from '@/features/ui/hooks/useToast';
import { MapPinIcon, PlusIcon, PencilIcon, TrashIcon, HomeIcon } from '@heroicons/react/24/outline';
import { MinnesotaAddressSearch } from '@/features/onboarding/components/MinnesotaAddressSearch';
import ProfilePhoto from '@/components/ProfilePhoto';
import { ProfileService } from '@/features/profiles/services/profileService';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MyHomesPage() {
  const router = useRouter();
  const { selectedProfile, refreshProfiles } = useProfile();
  const { error: showError, success: showSuccess } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [homes, setHomes] = useState<MyHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHome, setEditingHome] = useState<MyHome | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateMyHomeData>({
    address: '',
    lat: 0,
    lng: 0,
    nickname: null,
    notes: null,
  });

  const {
    map,
    mapLoaded,
    mapInfo,
    addMarker,
    removeMarker,
    flyTo,
  } = useMap({
    mapContainer,
    onMapReady: (mapInstance) => {
      console.log('Map ready:', mapInstance);
      // Map is ready - resize to ensure proper rendering
      if (mapInstance) {
        setTimeout(() => {
          mapInstance.resize();
        }, 100);
      }
    },
    onMapClick: () => {
      // Handle map clicks if needed
    },
  });

  // Check profile type - only allow homeowner
  useEffect(() => {
    if (selectedProfile && selectedProfile.profile_type !== 'homeowner') {
      router.push('/');
      return;
    }
  }, [selectedProfile, router]);

  // Resize map when it loads to ensure proper rendering
  useEffect(() => {
    if (mapLoaded && map && mapContainer.current) {
      // Small delay to ensure container is fully rendered
      const timer = setTimeout(() => {
        map.resize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, map]);

  // Load homes when profile changes
  useEffect(() => {
    if (selectedProfile && selectedProfile.profile_type === 'homeowner') {
      loadHomes();
    } else {
      setHomes([]);
      setLoading(false);
    }
  }, [selectedProfile?.id]); // Only depend on profile ID to avoid unnecessary reloads

  // Render homes on map
  useEffect(() => {
    if (!mapLoaded || !map || !addMarker || !removeMarker) return;

    // Track marker IDs for cleanup
    const markerIds: string[] = [];

    // Add markers for all homes
    homes.forEach((home) => {
      // Validate coordinates
      if (!home.lat || !home.lng || isNaN(home.lat) || isNaN(home.lng)) {
        console.warn('Invalid coordinates for home:', home.id, home);
        return;
      }

      const markerId = `home-${home.id}`;
      markerIds.push(markerId);

      // Create popup content with home details
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          ${home.nickname ? `<div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${home.nickname}</div>` : ''}
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${home.address}</div>
          ${home.notes ? `<div style="font-size: 11px; color: #888; margin-top: 4px; font-style: italic;">${home.notes}</div>` : ''}
        </div>
      `;

      // Add marker with gold color
      addMarker(markerId, { lat: home.lat, lng: home.lng }, {
        color: '#C2B289',
        popupContent: popupContent.trim(),
      });
    });

    // Fit map to show all homes (only if we have homes with valid coordinates)
    const validHomes = homes.filter(h => h.lat && h.lng && !isNaN(h.lat) && !isNaN(h.lng));
    if (validHomes.length > 0) {
      const bounds = validHomes.reduce((acc, home) => {
        return {
          minLat: Math.min(acc.minLat, home.lat),
          maxLat: Math.max(acc.maxLat, home.lat),
          minLng: Math.min(acc.minLng, home.lng),
          maxLng: Math.max(acc.maxLng, home.lng),
        };
      }, {
        minLat: validHomes[0].lat,
        maxLat: validHomes[0].lat,
        minLng: validHomes[0].lng,
        maxLng: validHomes[0].lng,
      });

      // If only one home, zoom to it; otherwise fit bounds
      if (validHomes.length === 1) {
        map.flyTo({
          center: [validHomes[0].lng, validHomes[0].lat],
          zoom: 15,
          duration: 1000,
        });
      } else {
        map.fitBounds(
          [
            [bounds.minLng - 0.05, bounds.minLat - 0.05],
            [bounds.maxLng + 0.05, bounds.maxLat + 0.05],
          ],
          { padding: 50, duration: 1000 }
        );
      }
    } else if (homes.length === 0 && map) {
      // If no homes, zoom to Minnesota default
      map.flyTo({
        center: [-94.6859, 46.7296],
        zoom: 6,
        duration: 1000,
      });
    }

    // Cleanup: remove all home markers when component unmounts or homes change
    return () => {
      markerIds.forEach((id) => {
        removeMarker(id);
      });
    };
  }, [mapLoaded, map, homes, addMarker, removeMarker]);

  const loadHomes = async () => {
    if (!selectedProfile || selectedProfile.profile_type !== 'homeowner') return;
    
    try {
      setLoading(true);
      const data = await MyHomesService.getHomesByProfile(selectedProfile.id);
      setHomes(data);
    } catch (err) {
      console.error('Error loading homes:', err);
      showError('Failed to load homes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHome = async () => {
    if (!selectedProfile || !formData.address || !formData.lat || !formData.lng) {
      showError('Please provide a valid address');
      return;
    }

    try {
      await MyHomesService.createHome(formData, selectedProfile.id);
      showSuccess('Home added successfully');
      setShowAddForm(false);
      setFormData({ address: '', lat: 0, lng: 0, nickname: null, notes: null });
      loadHomes();
    } catch (err) {
      console.error('Error adding home:', err);
      showError('Failed to add home');
    }
  };

  const handleUpdateHome = async (homeId: string, data: UpdateMyHomeData) => {
    try {
      await MyHomesService.updateHome(homeId, data);
      showSuccess('Home updated successfully');
      setEditingHome(null);
      loadHomes();
    } catch (err) {
      console.error('Error updating home:', err);
      showError('Failed to update home');
    }
  };

  const handleDeleteHome = async (homeId: string) => {
    if (!confirm('Are you sure you want to delete this home?')) return;

    try {
      await MyHomesService.deleteHome(homeId);
      showSuccess('Home deleted successfully');
      loadHomes();
    } catch (err) {
      console.error('Error deleting home:', err);
      showError('Failed to delete home');
    }
  };

  const handleFlyToHome = (home: MyHome) => {
    if (map) {
      map.flyTo({
        center: [home.lng, home.lat],
        zoom: 16,
        duration: 1500,
      });
    }
  };

  if (!selectedProfile) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No Profile Selected</p>
            <p className="text-gray-500 text-sm">Please select a profile to manage your homes</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Check if profile type is homeowner
  if (selectedProfile.profile_type !== 'homeowner') {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Access Restricted</p>
            <p className="text-gray-500 text-sm">This page is only available for homeowner profiles</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100">
      <div className="min-h-screen bg-gold-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">My Homes</h1>
            <p className="text-gray-700 mb-3">Manage your owned properties</p>
            {/* Profile Info */}
            {selectedProfile && (
              <div className="flex items-center gap-3 mt-3">
                <ProfilePhoto
                  profile={selectedProfile}
                  size="sm"
                  editable={false}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ProfileService.getDisplayName(selectedProfile)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedProfile.profile_type}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Homes List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border-2 border-gold-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-black">Your Homes</h2>
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingHome(null);
                      setFormData({ address: '', lat: 0, lng: 0, nickname: null, notes: null });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gold-500 text-black rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Home
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading...</p>
                  </div>
                ) : homes.length === 0 ? (
                  <div className="text-center py-8">
                    <HomeIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No homes added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {homes.map((home) => (
                      <div
                        key={home.id}
                        className="p-3 bg-gold-50 rounded-lg border border-gold-200 hover:border-gold-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {home.nickname && (
                              <h3 className="font-semibold text-black mb-1">{home.nickname}</h3>
                            )}
                            <p className="text-sm text-gray-700 mb-2">{home.address}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFlyToHome(home)}
                                className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1"
                              >
                                <MapPinIcon className="w-3 h-3" />
                                View on Map
                              </button>
                              <button
                                onClick={() => {
                                  setEditingHome(home);
                                  setShowAddForm(false);
                                  setFormData({
                                    address: home.address,
                                    lat: home.lat,
                                    lng: home.lng,
                                    nickname: home.nickname || null,
                                    notes: home.notes || null,
                                  });
                                }}
                                className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1"
                              >
                                <PencilIcon className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteHome(home.id)}
                                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                              >
                                <TrashIcon className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Form */}
                {(showAddForm || editingHome) && (
                  <div className="mt-4 p-4 bg-gold-50 rounded-lg border border-gold-200">
                    <h3 className="font-semibold text-black mb-3">
                      {editingHome ? 'Edit Home' : 'Add New Home'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <MinnesotaAddressSearch
                          value={formData.address}
                          onChange={(address, coordinates) => {
                            setFormData({
                              ...formData,
                              address,
                              lat: coordinates?.lat || 0,
                              lng: coordinates?.lng || 0,
                            });
                            if (coordinates && map) {
                              map.flyTo({
                                center: [coordinates.lng, coordinates.lat],
                                zoom: 16,
                                duration: 1500,
                              });
                            }
                          }}
                          onFlyTo={(coordinates) => {
                            if (map) {
                              map.flyTo({
                                center: [coordinates.lng, coordinates.lat],
                                zoom: 16,
                                duration: 1500,
                              });
                            }
                          }}
                          placeholder="Search Minnesota address..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nickname (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.nickname || ''}
                          onChange={(e) => setFormData({ ...formData, nickname: e.target.value || null })}
                          placeholder="e.g., Main House"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (optional)
                        </label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                          placeholder="Add any notes about this home..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (editingHome) {
                              handleUpdateHome(editingHome.id, formData);
                            } else {
                              handleAddHome();
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-gold-500 text-black rounded-lg hover:bg-gold-600 transition-colors font-medium"
                        >
                          {editingHome ? 'Update' : 'Add'} Home
                        </button>
                        <button
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingHome(null);
                            setFormData({ address: '', lat: 0, lng: 0, nickname: null, notes: null });
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border-2 border-gold-200 overflow-hidden">
                <div className="h-[600px] w-full relative" style={{ minHeight: '600px', position: 'relative' }}>
                  <div
                    ref={mapContainer}
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0
                    }}
                  />
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

