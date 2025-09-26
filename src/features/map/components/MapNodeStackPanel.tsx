'use client';

import { useState, useCallback } from 'react';
import NodeStack from '@/features/nodes/components/NodeStack';
import MapNodeStackFooter from './MapNodeStackFooter';
import { NodeData, SessionData, sessionStorageService } from '@/features/session/services/sessionStorage';
import { Address } from '../types';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { AddressService } from '@/features/api/services/addressService';
import { NameSearchService } from '@/features/api/services/nameSearchService';
import { EmailSearchService } from '@/features/api/services/emailSearchService';
import { PhoneSearchService } from '@/features/api/services/phoneSearchService';
import { ZillowSearchService } from '@/features/api/services/zillowSearchService';
import { apiService } from '@/features/api/services/apiService';
import { GeocodingService } from '@/features/map/services/geocodingService';
import { useToast } from '@/features/ui/hooks/useToast';

interface MapNodeStackPanelProps {
  currentSession: SessionData;
  onPersonTrace: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel: (addressData: Address) => void;
  onStartNodeComplete: (startNodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddNode?: (node: NodeData) => void;
  onRenameSession?: (sessionId: string, newName: string) => void;
  onStartNodeAddressChanged?: (address: { street: string; city: string; state: string; zip: string }) => Promise<void>;
  onUserFoundLocationFound?: (nodeId: string, coords: { lat: number; lng: number }, address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } }) => void;
  onUserFoundStartTracking?: () => void;
  onUserFoundStopTracking?: () => void;
  onCreateNewLocationSession?: () => void;
  onContinueToAddressSearch?: () => void;
  isTracking?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  lastUpdated?: number | null;
  refreshCount?: number;
}

export default function MapNodeStackPanel({ 
  currentSession, 
  onPersonTrace, 
  onAddressIntel, 
  onStartNodeComplete, 
  onDeleteNode,
  onAddNode,
  onRenameSession,
  onStartNodeAddressChanged,
  onUserFoundLocationFound,
  onUserFoundStartTracking,
  onUserFoundStopTracking,
  onCreateNewLocationSession,
  onContinueToAddressSearch,
  isTracking,
  userLocation,
  lastUpdated: _lastUpdated,
  refreshCount: _refreshCount
}: MapNodeStackPanelProps) {
  const [isSearching] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const { withApiToast } = useToast();

  // Handle person trace from person node - pass through to parent
  const handlePersonTrace = async (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => {
    // Pass the call through to the parent component
    onPersonTrace(personId, personData, apiName, parentNodeId, entityId, entityData);
  };

  // Handle address intel from address node
  const handleAddressIntel = async (addressData: { street: string; city: string; state: string; zip: string }) => {
    if (!currentSession) return;
    
    // setIsSearching(true); // Removed unused setter
    
    try {
      // Geocode the address first
      const geocodingResult = await GeocodingService.geocodeAddress(addressData);
      const addressWithCoordinates = {
        ...addressData,
        coordinates: geocodingResult.success ? geocodingResult.coordinates : undefined,
      };

      const response = await withApiToast(
        'Address Intel',
        () => apiService.callSkipTraceAPI(addressData),
        {
          loadingMessage: `Analyzing address: ${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zip}`,
          successMessage: 'Address intel completed successfully',
          errorMessage: 'Failed to analyze address'
        }
      );

      const newNode: NodeData = {
        id: `address-${Date.now()}`,
        type: 'api-result',
        apiName: 'Skip Trace',
        address: addressWithCoordinates,
        response: response,
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node')
      };

      // Call the parent handler
      onAddressIntel(addressWithCoordinates);
    } catch (error) {
      console.error('Address intel error:', error);
    } finally {
      // setIsSearching(false); // Removed unused setter
    }
  };

  // Handle address search from Start Node using centralized service
  const handleAddressSearch = useCallback(async (addressData: { street: string; city: string; state: string; zip: string }) => {
    if (!currentSession) return;
    
    try {
      const result = await AddressService.searchAddressWithToast(
        addressData,
        currentSession.id,
        withApiToast
      );

      if (result.success && result.node) {
        // The result node is already created by the service
        // We need to add it to the session through the parent
        if (onAddNode) {
          onAddNode(result.node);
        }
      }
    } catch (error) {
      console.error('Address search error:', error);
    }
  }, [currentSession, withApiToast, onAddNode]);

  // Handle name search using centralized service
  const handleNameSearch = useCallback(async (nameData: { firstName: string; middleInitial?: string; lastName: string }) => {
    if (!currentSession) return;
    
    try {
      const result = await NameSearchService.searchNameWithToast(
        nameData,
        currentSession.id,
        withApiToast
      );

      if (result.success && result.node) {
        if (onAddNode) {
          onAddNode(result.node);
        }
      }
    } catch (error) {
      console.error('Name search error:', error);
    }
  }, [currentSession, withApiToast, onAddNode]);

  // Handle email search using centralized service
  const handleEmailSearch = useCallback(async (emailData: { email: string }) => {
    if (!currentSession) return;
    
    try {
      const result = await EmailSearchService.searchEmailWithToast(
        emailData.email,
        currentSession.id,
        withApiToast
      );

      if (result.success && result.node) {
        if (onAddNode) {
          onAddNode(result.node);
        }
      }
    } catch (error) {
      console.error('Email search error:', error);
    }
  }, [currentSession, withApiToast, onAddNode]);

  // Handle phone search using centralized service
  const handlePhoneSearch = useCallback(async (phoneData: { phone: string }) => {
    if (!currentSession) return;
    
    try {
      const result = await PhoneSearchService.searchPhoneWithToast(
        phoneData.phone,
        currentSession.id,
        withApiToast
      );

      if (result.success && result.node) {
        if (onAddNode) {
          onAddNode(result.node);
        }
      }
    } catch (error) {
      console.error('Phone search error:', error);
    }
  }, [currentSession, withApiToast, onAddNode]);

  // Handle Zillow search using centralized service
  const handleZillowSearch = useCallback(async (addressData: { street: string; city: string; state: string; zip: string }) => {
    if (!currentSession) return;
    
    try {
      const result = await ZillowSearchService.searchZillowWithToast(
        addressData,
        currentSession.id,
        withApiToast
      );

      if (result.success && result.node) {
        if (onAddNode) {
          onAddNode(result.node);
        }
      }
    } catch (error) {
      console.error('Zillow search error:', error);
    }
  }, [currentSession, withApiToast, onAddNode]);

  // Handle start node completion
  const handleStartNodeComplete = useCallback((startNodeId: string) => {
    onStartNodeComplete(startNodeId);
  }, [onStartNodeComplete]);

  // Handle session name editing
  const handleStartEditingName = useCallback(() => {
    if (currentSession) {
      setEditingName(currentSession.name);
      setIsEditingName(true);
    }
  }, [currentSession]);

  const handleSaveName = useCallback(() => {
    if (currentSession && onRenameSession && editingName.trim()) {
      onRenameSession(currentSession.id, editingName.trim());
      setIsEditingName(false);
    }
  }, [currentSession, onRenameSession, editingName]);

  const handleCancelEditing = useCallback(() => {
    setIsEditingName(false);
    setEditingName('');
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  }, [handleSaveName, handleCancelEditing]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {!currentSession ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Skip Trace Session</h3>
          <p className="text-sm text-gray-500 mb-4">
            Click &quot;New Session&quot; in the header to begin your skip trace session.
          </p>
          <div className="text-xs text-gray-400">
            <p>• Every session starts with finding your location</p>
            <p>• Then you can search addresses or drop pins on the map</p>
            <p>• Build your address record step by step</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Hero Section with Editable Session Name */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleSaveName}
                      className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                      autoFocus
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={handleSaveName}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Save"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 group">
                    <h2 
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={handleStartEditingName}
                      title="Click to edit session name"
                    >
                      {currentSession.name}
                    </h2>
                    <button
                      onClick={handleStartEditingName}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      title="Edit session name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {currentSession.nodes.length} node{currentSession.nodes.length !== 1 ? 's' : ''} • 
                  Created {new Date(currentSession.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Node Stack */}
          <div className="flex-1 overflow-y-auto p-4">
            <NodeStack
              nodes={currentSession.nodes}
              onPersonTrace={handlePersonTrace}
              onAddressIntel={handleAddressIntel}
              onAddressSearch={handleAddressSearch}
              onNameSearch={handleNameSearch}
              onEmailSearch={handleEmailSearch}
              onPhoneSearch={handlePhoneSearch}
              onZillowSearch={handleZillowSearch}
              onStartNodeComplete={handleStartNodeComplete}
              onDeleteNode={onDeleteNode}
              onAddNode={onAddNode}
              onStartNodeAddressChanged={onStartNodeAddressChanged}
              onUserFoundLocationFound={onUserFoundLocationFound}
              onUserFoundStartTracking={onUserFoundStartTracking}
              onUserFoundStopTracking={onUserFoundStopTracking}
              onCreateNewLocationSession={onCreateNewLocationSession}
              onContinueToAddressSearch={onContinueToAddressSearch}
              isTracking={isTracking}
              userLocation={userLocation}
            />
          </div>

          {/* Footer */}
          <MapNodeStackFooter
            sessionName={currentSession.name}
            nodeCount={currentSession.nodes.length}
            entityCount={sessionStorageService.getEntitySummary().total}
          />
        </div>
      )}
    </div>
  );
}
