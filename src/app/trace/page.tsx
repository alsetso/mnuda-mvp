'use client';

import { useCallback } from 'react';
import AppHeader from '@/features/session/components/AppHeader';
import TraceForm from '@/components/TraceForm';
import NodeStack from '@/features/nodes/components/NodeStack';
import { useSessionManager, useApiUsageContext } from '@/features/session';
import { apiUsageService } from '@/features/session/services/apiUsageService';
import { NodeData } from '@/features/session/services/sessionStorage';
import { useToast } from '@/features/ui/hooks/useToast';
import { apiService, CreditsExhaustedError } from '@/features/api/services/apiService';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { personDetailParseService } from '@/features/api/services/personDetailParse';


export default function TracePage() {
  const { error, success, withApiToast } = useToast();
  const { showCreditsModal } = useApiUsageContext();
  
  // Session management
  const {
    currentSession,
    sessions,
    createNewSession,
    switchSession,
    renameSession,
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
      if (err instanceof CreditsExhaustedError) {
        showCreditsModal();
        return;
      }
    }
  }, [currentSession, addNode, withApiToast, showCreditsModal]);


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

  // const handleNodeClick = (node: NodeData) => {
  //   // Handle node click - could open a modal or navigate to details
  //   console.log('Node clicked:', node);
  // };


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
          updateUrl={false}
          showSessionSelector={true}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
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