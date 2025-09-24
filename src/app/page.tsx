'use client';

import { useState, useEffect } from 'react';
import AddressNode from '@/components/AddressNode';
import NodeStack from '@/components/NodeStack';
import SessionSelector from '@/components/SessionSelector';
import SessionHero from '@/components/SessionHero';
import UsageModal from '@/components/UsageModal';
import { apiOptions, apiService } from '@/lib/apiService';
import { useToast } from '@/hooks/useToast';
import { useSessionManager } from '@/hooks/useSessionManager';
import { NodeData } from '@/lib/sessionStorage';

export default function Home() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
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
    setNodes(currentNodes);
  }, [currentSession, getCurrentNodes]);

  const handleApiCall = (address: { street: string; city: string; state: string; zip: string }, apiName: string, response: unknown) => {
    const newNode: NodeData = {
      id: `api-${Date.now()}`,
      type: 'api-result',
      address,
      apiName,
      response,
      timestamp: Date.now()
    };
    setNodes(prev => [...prev, newNode]);
    addNode(newNode); // This will trigger refresh automatically
  };

  const handlePersonTrace = (personId: string, personData: unknown, apiName: string) => {
    const newNode: NodeData = {
      id: `person-${Date.now()}`,
      type: 'people-result',
      personId,
      personData,
      apiName,
      timestamp: Date.now()
    };
    setNodes(prev => [...prev, newNode]);
    addNode(newNode); // This will trigger refresh automatically
  };

  const handleAddressIntel = async (address: { street: string; city: string; state: string; zip: string }) => {
    // Call Skip Trace API for the address
    const skipTraceApi = apiOptions.find(api => api.id === 'skip-trace');
    if (skipTraceApi) {
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
          apiName: skipTraceApi.name,
          response,
          timestamp: Date.now()
        };
        setNodes(prev => [...prev, newNode]);
        addNode(newNode); // This will trigger refresh automatically
      } catch (error) {
        console.error('Skip Trace API call failed:', error);
      }
    }
  };

  // Session management handlers
  const handleSessionChange = (newNodes: unknown[]) => {
    setNodes(newNodes as NodeData[]);
  };

  const handleNewSession = () => {
    createNewSession();
    setNodes([]);
  };

  const handleSessionSwitch = (sessionId: string) => {
    const newNodes = switchSession(sessionId);
    return newNodes;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left side - Logo and Session Selector */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <h1 className="text-base sm:text-lg font-semibold">
                  <span className="text-[#014463]">MN</span>
                  <span className="text-[#1dd1f5]">UDA</span>
                </h1>
              </div>
              <div className="min-w-0 flex-1">
                <SessionSelector 
                  onSessionChange={handleSessionChange}
                  onNewSession={handleNewSession}
                  currentSession={currentSession}
                  sessions={sessions}
                  onSessionSwitch={handleSessionSwitch}
                  onSessionRename={renameSession}
                />
              </div>
            </div>
            
            {/* Right side - API Label and Usage Icon */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <span className="hidden sm:inline text-sm text-gray-500">Property Lookup API</span>
              
              {/* Usage Icon */}
              <button
                onClick={() => setIsUsageModalOpen(true)}
                className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation"
                title="View storage usage"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Hero */}
      <SessionHero 
        currentSession={currentSession}
        onSessionRename={renameSession}
        refreshTrigger={currentSession?.lastAccessed}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AddressNode 
          onApiCall={handleApiCall}
          lastSearchedAddress={nodes.length > 0 ? nodes[nodes.length - 1]?.address : null}
          hasSearched={nodes.length > 0}
        />
        
        {/* Node Stack */}
        <div className="mt-4 sm:mt-6 lg:mt-8">
        <NodeStack 
          nodes={nodes}
          onPersonTrace={handlePersonTrace}
          onAddressIntel={handleAddressIntel}
        />
        </div>
      </div>

      {/* Usage Modal */}
      <UsageModal 
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        onSessionSwitch={handleSessionSwitch}
      />
    </main>
  )
}
