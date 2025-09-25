'use client';

import { useState, useEffect } from 'react';
import SessionHero from '@/features/session/components/SessionHero';
import AppHeader from '@/features/session/components/AppHeader';
import TabSection from '@/features/ui/components/TabSection';
import { apiService } from '@/features/api/services/apiService';
import { useToast } from '@/features/ui/hooks/useToast';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import { NodeData } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { GeocodingService } from '@/features/map/services/geocodingService';

export default function Home() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const { withApiToast } = useToast();
  const { 
    currentSession, 
    sessions,
    addNode, 
    createNewSession, 
    switchSession, 
    renameSession,
    getCurrentNodes 
  } = useSessionManager();

  // Initialize nodes from current session
  useEffect(() => {
    const currentNodes = getCurrentNodes();
    // If no nodes exist, create a start node
    if (currentNodes.length === 0) {
      const startNode: NodeData = {
        id: 'start-node',
        type: 'start',
        apiName: 'Skip Trace API',
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
      };
      setNodes([startNode]);
    } else {
      setNodes(currentNodes);
    }
  }, [currentSession, getCurrentNodes]);

  const handleAddressSearch = async (address: { street: string; city: string; state: string; zip: string }) => {
    try {
      // Geocode the address first
      const geocodingResult = await GeocodingService.geocodeAddress(address);
      const addressWithCoordinates = {
        ...address,
        coordinates: geocodingResult.success ? geocodingResult.coordinates : undefined,
      };

      const response = await withApiToast(
        'Skip Trace Address Search',
        () => apiService.callSkipTraceAPI(address),
        {
          loadingMessage: `Searching address: ${address.street}, ${address.city}, ${address.state} ${address.zip}`,
          successMessage: 'Address search completed successfully',
          errorMessage: 'Failed to search address'
        }
      );

      const newNode: NodeData = {
        id: `api-${Date.now()}`,
        type: 'api-result',
        address: addressWithCoordinates,
        apiName: 'Skip Trace',
        response,
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
      };
      setNodes(prev => [...prev, newNode]);
      addNode(newNode);
    } catch (error) {
      console.error('Address search error:', error);
    }
  };


  const handlePersonTrace = (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => {
    console.log('Main page handlePersonTrace received:', {
      personId,
      apiName,
      parentNodeId,
      entityId,
      entityData,
      timestamp: new Date().toISOString()
    });
    
    const newNode: NodeData = {
      id: `person-${Date.now()}`,
      type: 'people-result',
      personId,
      personData,
      apiName,
      timestamp: Date.now(),
      mnNodeId: MnudaIdService.generateTypedId('node'),
      // Establish parent-child relationship if parent is provided
      parentNodeId: parentNodeId,
      clickedEntityId: entityId, // Store the entity ID that triggered this node
      clickedEntityData: entityData, // Store the entity data that triggered this node
    };
    
    console.log('Created newNode with clickedEntityId:', newNode.clickedEntityId);
    console.log('Created newNode with clickedEntityData:', newNode.clickedEntityData);
    console.log('Full newNode object:', newNode);
    
    // Update parent node to include this child
    if (parentNodeId) {
      setNodes(prev => prev.map(node => 
        node.mnNodeId === parentNodeId 
          ? { 
              ...node, 
              childMnudaIds: [...(node.childMnudaIds || []), newNode.mnNodeId!],
              entityCount: (node.entityCount || 0) + 1
            }
          : node
      ));
    }
    
    setNodes(prev => [...prev, newNode]);
    addNode(newNode); // This will trigger refresh automatically
  };

  const handleAddressIntel = async (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => {
    try {
      const response = await withApiToast(
        'Skip Trace Address Lookup',
        () => apiService.callSkipTraceAPI(address),
        {
          loadingMessage: `Looking up address data for ${address.street}`,
          successMessage: 'Address data retrieved successfully',
          errorMessage: 'Failed to retrieve address data'
        }
      );
      
      const newNode: NodeData = {
        id: `intel-${Date.now()}`,
        type: 'api-result',
        address,
        apiName: 'Skip Trace',
        response,
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
        clickedEntityId: entityId,
      };
      setNodes(prev => [...prev, newNode]);
      addNode(newNode);
    } catch (error) {
      console.error('Skip Trace API call failed:', error);
    }
  };

  // Session management handlers
  const handleNewSession = () => {
    createNewSession();
    // Create a new start node for the new session
    const startNode: NodeData = {
      id: 'start-node',
      type: 'start',
      apiName: 'Skip Trace API',
      timestamp: Date.now(),
      mnNodeId: MnudaIdService.generateTypedId('node'),
    };
    setNodes([startNode]);
  };


  const handleStartNodeCompleteWrapper = () => {
    // This will be called by NodeStack when it determines the start node should be completed
    // We'll find the start node and mark it as completed
    setNodes(prev => prev.map(node => 
      node.type === 'start' 
        ? { ...node, hasCompleted: true }
        : node
    ));
  };

  return (
    <div className="bg-gray-50">
      {/* Shared Header */}
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSessionSwitch={switchSession}
        onSessionRename={renameSession}
      />

      {/* Session Hero */}
      <SessionHero 
        currentSession={currentSession}
        onSessionRename={renameSession}
        refreshTrigger={currentSession?.lastAccessed}
      />

      {/* Tab Section */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <TabSection
          nodes={nodes}
          onPersonTrace={handlePersonTrace}
          onAddressIntel={handleAddressIntel}
          onAddressSearch={handleAddressSearch}
          onStartNodeComplete={handleStartNodeCompleteWrapper}
        />
      </div>

    </div>
  )
}
