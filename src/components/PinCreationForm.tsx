'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/features/ui/hooks/useToast';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PinCategoryService, PinCategory } from '@/features/pins/services/pinService';

interface PinCreationFormProps {
  coordinates: { lat: number; lng: number } | null;
  address: string;
  isLoadingAddress: boolean;
  onSave: (data: {
    emoji: string;
    name: string;
    visibility: 'public' | 'private';
    description: string;
    address: string;
    lat: number;
    long: number;
    category_id?: string | null;
    subcategory?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  currentZoom: number;
  minZoom: number;
  addMarker?: (id: string, coordinates: { lat: number; lng: number }, options?: { element?: HTMLElement; color?: string; popupContent?: string }) => void;
  removeMarker?: (id: string) => void;
}

const TEMP_PIN_MARKER_ID = 'temp-pin-preview';

type PinType = 'project' | 'listing' | 'public_concern' | null;
type ProjectScale = 'home-repair' | 'renovation' | 'new-construction' | 'commercial' | 'mixed-use' | 'city-development' | null;
type ListingType = 'residential' | 'commercial' | 'land' | 'multi-family' | 'other' | null;
type PublicConcernType = 'safety' | 'infrastructure' | 'environmental' | 'zoning' | 'traffic' | 'other' | null;

export function PinCreationForm({
  coordinates,
  address,
  isLoadingAddress,
  onSave,
  onCancel,
  currentZoom,
  minZoom,
  addMarker,
  removeMarker,
}: PinCreationFormProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [pinType, setPinType] = useState<PinType>(null);
  const [projectScale, setProjectScale] = useState<ProjectScale>(null);
  const [listingType, setListingType] = useState<ListingType>(null);
  const [publicConcernType, setPublicConcernType] = useState<PublicConcernType>(null);
  const [emoji, setEmoji] = useState('🏠');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<PinCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  // Create temporary marker element
  const createTempMarkerElement = useCallback((emojiValue: string): HTMLElement => {
    const markerContainer = document.createElement('div');
    markerContainer.className = 'temp-pin-preview-marker';
    markerContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
    `;

    // Pulsing blue ring
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid #3B82F6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3),
                  0 0 0 4px rgba(59, 130, 246, 0.2),
                  0 0 20px rgba(59, 130, 246, 0.4);
      animation: temp-pin-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `;

    // Emoji container
    const emojiContainer = document.createElement('div');
    emojiContainer.style.cssText = `
      position: relative;
      z-index: 1;
      font-size: 28px;
      line-height: 1;
      text-align: center;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 50%;
      border: 2px solid #3B82F6;
    `;
    emojiContainer.textContent = emojiValue;

    markerContainer.appendChild(ring);
    markerContainer.appendChild(emojiContainer);

    // Add animation keyframes if not already added
    if (!document.getElementById('temp-pin-preview-styles')) {
      const style = document.createElement('style');
      style.id = 'temp-pin-preview-styles';
      style.textContent = `
        @keyframes temp-pin-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    return markerContainer;
  }, []);

  // Show/hide temporary marker when coordinates change or form is open
  useEffect(() => {
    if (!addMarker || !removeMarker) return;

    // Remove marker when coordinates are cleared or form is cancelled
    if (!coordinates) {
      removeMarker(TEMP_PIN_MARKER_ID);
      return;
    }

    // Add or update temporary marker
    const markerElement = createTempMarkerElement(emoji);
    addMarker(TEMP_PIN_MARKER_ID, coordinates, {
      element: markerElement,
    });

    // Cleanup on unmount
    return () => {
      removeMarker(TEMP_PIN_MARKER_ID);
    };
  }, [coordinates, emoji, addMarker, removeMarker, createTempMarkerElement]);

  // Cleanup marker when form is cancelled
  useEffect(() => {
    return () => {
      if (removeMarker) {
        removeMarker(TEMP_PIN_MARKER_ID);
      }
    };
  }, [removeMarker]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const cats = await PinCategoryService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Update category_id when pinType changes
  useEffect(() => {
    if (pinType && categories.length > 0) {
      const category = categories.find(cat => cat.slug === pinType);
      if (category) {
        setCategoryId(category.id);
      }
    } else if (!pinType) {
      setCategoryId(null);
    }
  }, [pinType, categories]);

  // Reset to step 0 when coordinates change
  useEffect(() => {
    if (!coordinates) {
      setStep(0);
      setPinType(null);
      setProjectScale(null);
      setListingType(null);
      setPublicConcernType(null);
    } else if (coordinates && pinType && (projectScale || listingType || publicConcernType)) {
      setStep(2);
    } else if (coordinates && pinType) {
      setStep(1);
    } else if (coordinates) {
      setStep(0);
    }
  }, [coordinates, pinType, projectScale, listingType, publicConcernType]);

  const handlePinTypeSelect = (type: 'project' | 'listing' | 'public_concern') => {
    setPinType(type);
    // Set default emoji based on type (fixed, not editable)
    if (type === 'project') {
      setEmoji('🏗️');
    } else if (type === 'listing') {
      setEmoji('🏠');
    } else if (type === 'public_concern') {
      setEmoji('⚠️');
    }
    setStep(1);
  };

  const handleScaleOrTypeSelect = (value: ProjectScale | ListingType | PublicConcernType) => {
    if (pinType === 'project') {
      setProjectScale(value as ProjectScale);
    } else if (pinType === 'listing') {
      setListingType(value as ListingType);
    } else if (pinType === 'public_concern') {
      setPublicConcernType(value as PublicConcernType);
    }
    setStep(2);
  };

  const handleNext = () => {
    if (!coordinates) {
      error('Location Required', 'Please click on the map to select a location');
      return;
    }
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else if (step === 1) {
      setStep(0);
      setPinType(null);
      setProjectScale(null);
      setListingType(null);
      setPublicConcernType(null);
    }
  };

  const handleCancel = () => {
    // Remove temporary marker when cancelling
    if (removeMarker) {
      removeMarker(TEMP_PIN_MARKER_ID);
    }
    // Reset form state
    setStep(0);
    setPinType(null);
    setProjectScale(null);
    setListingType(null);
    setPublicConcernType(null);
    setName('');
    setDescription('');
    setEmoji('🏠');
    setCategoryId(null);
    setVisibility('public');
    onCancel();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      error('Name Required', 'Please enter a name for your pin');
      return;
    }
    if (!coordinates) {
      error('Location Required', 'Please select a location');
      return;
    }

    setIsSaving(true);
    try {
      const subcategoryValue = pinType === 'project' 
        ? projectScale 
        : pinType === 'listing' 
        ? listingType 
        : publicConcernType;
      await onSave({
        emoji,
        name: name.trim(),
        visibility,
        description: description.trim() || '',
        address,
        lat: coordinates.lat,
        long: coordinates.lng,
        category_id: categoryId || null,
        subcategory: subcategoryValue || null,
      });
      success('Pin Created', 'Your pin has been saved');
      // Remove temporary marker
      if (removeMarker) {
        removeMarker(TEMP_PIN_MARKER_ID);
      }
      // Reset form
      setStep(0);
      setPinType(null);
      setProjectScale(null);
      setListingType(null);
      setPublicConcernType(null);
      setName('');
      setDescription('');
      setEmoji('🏠');
      setCategoryId(null);
      setVisibility('public');
    } catch (err) {
      error('Save Failed', err instanceof Error ? err.message : 'Failed to save pin');
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = currentZoom >= minZoom;

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              title="Back"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h3 className="text-lg font-semibold text-white">
            Create Pin
          </h3>
        </div>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          title="Cancel"
        >
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        {step === 0 ? (
          /* Step 0: Select Pin Type */
          <div className="space-y-3">
            <p className="text-sm text-white/80 mb-3">
              {coordinates ? 'Select pin type:' : 'Click on the map to select a location first'}
            </p>
            {coordinates && (
              <div className="space-y-2">
                <button
                  onClick={() => handlePinTypeSelect('project')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏗️</span>
                  <div className="flex-1">
                    <div className="font-bold">Open Project</div>
                    <div className="text-xs text-white/70">Active construction, renovation, or job opening</div>
                  </div>
                </button>
                <button
                  onClick={() => handlePinTypeSelect('listing')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-bold">Active Listing</div>
                    <div className="text-xs text-white/70">Property for sale (owner or under contract)</div>
                  </div>
                </button>
                <button
                  onClick={() => handlePinTypeSelect('public_concern')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <div className="font-bold">Public Concern</div>
                    <div className="text-xs text-white/70">Community issues, safety, or infrastructure needs</div>
                  </div>
                </button>
              </div>
            )}
            {!canProceed && coordinates && (
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-200">
                  Zoom in to at least {minZoom}x (current: {currentZoom.toFixed(1)}x)
                </p>
              </div>
            )}
          </div>
        ) : step === 1 ? (
          /* Step 1: Scale/Type Selection */
          <div className="space-y-3">
            <p className="text-sm text-white/80 mb-3">
              {pinType === 'project' 
                ? 'What is the scale of this project?' 
                : pinType === 'listing'
                ? 'What type of listing is this?'
                : 'What type of public concern is this?'}
            </p>

            {pinType === 'project' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleScaleOrTypeSelect('home-repair')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🔧</span>
                  <div className="flex-1">
                    <div className="font-bold">Simple Home Repair</div>
                    <div className="text-xs text-white/70">Basic maintenance and small fixes</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('renovation')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏡</span>
                  <div className="flex-1">
                    <div className="font-bold">Renovation</div>
                    <div className="text-xs text-white/70">Home or building renovation project</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('new-construction')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏗️</span>
                  <div className="flex-1">
                    <div className="font-bold">New Construction</div>
                    <div className="text-xs text-white/70">Building new structures</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('commercial')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏢</span>
                  <div className="flex-1">
                    <div className="font-bold">Commercial Development</div>
                    <div className="text-xs text-white/70">Commercial building projects</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('mixed-use')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏘️</span>
                  <div className="flex-1">
                    <div className="font-bold">Mixed-Use Development</div>
                    <div className="text-xs text-white/70">Combined residential and commercial</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('city-development')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏙️</span>
                  <div className="flex-1">
                    <div className="font-bold">City Development</div>
                    <div className="text-xs text-white/70">Large-scale urban development projects</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleScaleOrTypeSelect('residential')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-bold">Residential</div>
                    <div className="text-xs text-white/70">Single family home</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('multi-family')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏘️</span>
                  <div className="flex-1">
                    <div className="font-bold">Multi-Family</div>
                    <div className="text-xs text-white/70">Duplex, triplex, or apartment building</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('commercial')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🏢</span>
                  <div className="flex-1">
                    <div className="font-bold">Commercial</div>
                    <div className="text-xs text-white/70">Office, retail, or commercial property</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('land')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🌳</span>
                  <div className="flex-1">
                    <div className="font-bold">Land</div>
                    <div className="text-xs text-white/70">Vacant land or lot</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('other')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <div className="font-bold">Other</div>
                    <div className="text-xs text-white/70">Other property type</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleScaleOrTypeSelect('safety')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🚨</span>
                  <div className="flex-1">
                    <div className="font-bold">Safety</div>
                    <div className="text-xs text-white/70">Safety hazards or concerns</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('infrastructure')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🛠️</span>
                  <div className="flex-1">
                    <div className="font-bold">Infrastructure</div>
                    <div className="text-xs text-white/70">Roads, utilities, or public facilities</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('environmental')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🌱</span>
                  <div className="flex-1">
                    <div className="font-bold">Environmental</div>
                    <div className="text-xs text-white/70">Environmental issues or concerns</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('zoning')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">📋</span>
                  <div className="flex-1">
                    <div className="font-bold">Zoning</div>
                    <div className="text-xs text-white/70">Zoning or land use concerns</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('traffic')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🚦</span>
                  <div className="flex-1">
                    <div className="font-bold">Traffic</div>
                    <div className="text-xs text-white/70">Traffic or transportation issues</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScaleOrTypeSelect('other')}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <div className="font-bold">Other</div>
                    <div className="text-xs text-white/70">Other public concern</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : step === 2 ? (
          /* Step 2: Location & Basic Info */
          <div className="space-y-4">
            {/* Pin Type Display */}
            {pinType && (
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-white/70 mb-1">Type</p>
                <p className="text-sm text-white font-medium">
                  {pinType === 'project' ? '🏗️ Open Project' : pinType === 'listing' ? '🏠 Active Listing' : '⚠️ Public Concern'}
                </p>
              </div>
            )}

            {/* Scale/Type Display */}
            {(projectScale || listingType || publicConcernType) && (
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-white/70 mb-1">
                  {pinType === 'project' ? 'Scale' : pinType === 'listing' ? 'Listing Type' : 'Concern Type'}
                </p>
                <p className="text-sm text-white font-medium">
                  {pinType === 'project' ? (
                    projectScale === 'home-repair' ? '🔧 Simple Home Repair' :
                    projectScale === 'renovation' ? '🏡 Renovation' :
                    projectScale === 'new-construction' ? '🏗️ New Construction' :
                    projectScale === 'commercial' ? '🏢 Commercial Development' :
                    projectScale === 'mixed-use' ? '🏘️ Mixed-Use Development' :
                    projectScale === 'city-development' ? '🏙️ City Development' : ''
                  ) : pinType === 'listing' ? (
                    listingType === 'residential' ? '🏠 Residential' :
                    listingType === 'multi-family' ? '🏘️ Multi-Family' :
                    listingType === 'commercial' ? '🏢 Commercial' :
                    listingType === 'land' ? '🌳 Land' :
                    listingType === 'other' ? '📍 Other' : ''
                  ) : (
                    publicConcernType === 'safety' ? '🚨 Safety' :
                    publicConcernType === 'infrastructure' ? '🛠️ Infrastructure' :
                    publicConcernType === 'environmental' ? '🌱 Environmental' :
                    publicConcernType === 'zoning' ? '📋 Zoning' :
                    publicConcernType === 'traffic' ? '🚦 Traffic' :
                    publicConcernType === 'other' ? '📍 Other' : ''
                  )}
                </p>
              </div>
            )}

            {/* Location Selection */}
            <div>
              {coordinates ? (
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  {isLoadingAddress ? (
                    <p className="text-sm text-white/80">Loading address...</p>
                  ) : (
                    <>
                      <p className="text-xs text-white/70 mb-1">Location</p>
                      <p className="text-sm text-white font-medium">{address || 'Address not available'}</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-sm text-white/80">Click on the map to select a location</p>
                </div>
              )}
              {!canProceed && coordinates && (
                <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg mt-2">
                  <p className="text-xs text-orange-200">
                    Zoom in to at least {minZoom}x (current: {currentZoom.toFixed(1)}x)
                  </p>
                </div>
              )}
            </div>

            {/* Name Input */}
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pin name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                autoFocus
              />
            </div>

            {/* Category Display (auto-set based on pin type) */}
            {pinType && categoryId && (
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-white/70 mb-1">Category</p>
                <p className="text-sm text-white font-medium">
                  {pinType === 'project' ? '🏗️ Open Project' : pinType === 'listing' ? '🏠 Active Listing' : '⚠️ Public Concern'}
                </p>
              </div>
            )}

            {/* Continue Button */}
            {coordinates && pinType && (projectScale || listingType || publicConcernType) && (
              <button
                onClick={handleNext}
                disabled={!canProceed || isLoadingAddress || !name.trim()}
                className="w-full px-4 py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <CheckIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Step 3: Additional Details */
          <div className="space-y-4">
            {/* Location Summary */}
            {coordinates && (
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-sm text-white font-medium">{address || 'Address not available'}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
              />
            </div>

            {/* Visibility */}
            <div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisibility('public')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    visibility === 'public'
                      ? 'bg-blue-600/80 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Public
                </button>
                <button
                  onClick={() => setVisibility('private')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    visibility === 'private'
                      ? 'bg-blue-600/80 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="w-full px-4 py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? 'Saving...' : pinType === 'project' ? 'Create Project' : pinType === 'listing' ? 'Create Listing' : 'Create Concern'}
              {!isSaving && <CheckIcon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

