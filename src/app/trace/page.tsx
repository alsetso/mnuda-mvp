'use client';

import { useState, useCallback } from 'react';
import AppHeader from '@/features/session/components/AppHeader';
import TraceForm from '@/components/TraceForm';
import NodeStack from '@/features/nodes/components/NodeStack';
import SkipTracePinsList from '@/features/map/components/SkipTracePinsList';
import { useSessionManager } from '@/features/session';
import { NodeData, sessionStorageService } from '@/features/session/services/sessionStorage';
import { useToast } from '@/features/ui/hooks/useToast';
import { apiService } from '@/features/api/services/apiService';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { personDetailParseService } from '@/features/api/services/personDetailParse';
import { useSkipTracePins } from '@/features/map/hooks/useSkipTracePins';
import { SkipTraceAddress } from '@/features/map/services/skipTraceAddressExtractor';


export default function TracePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipTraceSidebarOpen, setIsSkipTraceSidebarOpen] = useState(true); // Skip trace sidebar state - start open
  const { error, success, withApiToast } = useToast();
  
  // Session management
  const {
    currentSession,
    sessions,
    createNewSession,
    switchSession,
    addNode,
    deleteNode,
  } = useSessionManager();

  // Wrapper function for session switching
  const handleSessionSwitch = useCallback((sessionId: string) => {
    switchSession(sessionId);
  }, [switchSession]);

  // Handle person trace from NodeStack
  const handlePersonTrace = useCallback(async (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => {
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
    }
  }, [currentSession, addNode, withApiToast]);

  // Skip trace pins management
  const {
    skipTraceAddresses,
    isLoading: isSkipTracePinsLoading,
  } = useSkipTracePins({
    nodes: currentSession?.nodes || [],
    addMarker: () => {}, // No map on trace page, so no-op
    removeMarker: () => {}, // No map on trace page, so no-op
    mapLoaded: true, // Always "loaded" since no map
    onPersonTrace: handlePersonTrace,
    updateMarkerPopup: () => {}, // No map on trace page, so no-op
  });

  const handleTraceSubmit = async (node: NodeData) => {
    if (!currentSession) {
      error('Please create or select a session first');
      return;
    }

    try {
      // Add the node to the current session using the session manager
      addNode(node);
      success('Trace completed successfully');
    } catch (err) {
      console.error('Trace error:', err);
      error('Failed to complete trace. Please try again.');
    }
  };

  const handleNodeClick = (node: NodeData) => {
    // Handle node click - could open a modal or navigate to details
    console.log('Node clicked:', node);
  };

  // UI helpers
  const handleSkipTraceSidebarToggle = useCallback(() => {
    setIsSkipTraceSidebarOpen((prev) => !prev);
  }, []);

  const handleSkipTraceAddressClick = useCallback((address: SkipTraceAddress) => {
    // On trace page, we don't have a map to fly to, so just log the click
    console.log('Skip trace address clicked:', address);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0">
        <AppHeader
          currentSession={currentSession}
          sessions={sessions}
          onNewSession={createNewSession}
          onSessionSwitch={handleSessionSwitch}
          updateUrl={false}
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

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Skip Trace
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Enter any name, email, phone, or address to trace and find associated information. 
                  Results are saved to your current session.
                </p>
              </div>

              {/* Trace Form */}
              <TraceForm 
                onSubmit={handleTraceSubmit} 
                isLoading={isLoading}
              />

              {/* Trace Results */}
              {currentSession && currentSession.nodes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Trace Results</h3>
                    <p className="text-gray-600">{currentSession.nodes.length} result{currentSession.nodes.length !== 1 ? 's' : ''} found</p>
                  </div>
                  <NodeStack
                    nodes={currentSession.nodes}
                    onPersonTrace={handlePersonTrace}
                    onDeleteNode={deleteNode}
                    onAddNode={addNode}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
