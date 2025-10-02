'use client';

import { useState, useMemo } from 'react';
import { SkipTraceAddress } from '../services/skipTraceAddressExtractor';
import { NodeData, SessionData } from '@/features/session/services/sessionStorage';
import { peopleParseService } from '@/features/api/services/peopleParse';
import SessionSelectorAccordion from '@/features/session/components/SessionSelectorAccordion';

interface SkipTracePinsListProps {
  skipTraceAddresses: SkipTraceAddress[];
  isLoading: boolean;
  nodes: NodeData[];
  onAddressClick?: (address: SkipTraceAddress) => void;
  // Session management props
  currentSession: SessionData | null;
  sessions: SessionData[];
  onNewSession: () => SessionData;
  onSessionSwitch: (sessionId: string) => void;
  // Mobile close handler
  onClose?: () => void;
}

export default function SkipTracePinsList({ 
  skipTraceAddresses, 
  isLoading, 
  nodes,
  onAddressClick,
  currentSession,
  sessions,
  onNewSession,
  onSessionSwitch,
  onClose
}: SkipTracePinsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter addresses based on search term
  const filteredAddresses = useMemo(() => {
    if (!searchTerm.trim()) return skipTraceAddresses;
    
    const term = searchTerm.toLowerCase();
    return skipTraceAddresses.filter(address => 
      address.street.toLowerCase().includes(term) ||
      address.city.toLowerCase().includes(term) ||
      address.state.toLowerCase().includes(term) ||
      address.zip.includes(term)
    );
  }, [skipTraceAddresses, searchTerm]);

  const handleAddressClick = (address: SkipTraceAddress) => {
    onAddressClick?.(address);
  };

  // Get enhanced data for each address
  const getAddressStats = (address: SkipTraceAddress) => {
    try {
      // Parse the people data from the address
      const peopleData = peopleParseService.parsePeopleResponse(
        address.rawResponse as Record<string, unknown>, 
        address.nodeId
      );
      
      // Find child nodes that were created from this address's people
      const childNodes = nodes.filter(node => 
        node.type === 'people-result' && 
        (node.parentNodeId === address.nodeId || 
         (node.clickedEntityId && peopleData.people.some(p => p.mnEntityId === node.clickedEntityId)))
      );

      // Calculate total entities from child nodes
      const totalChildEntities = childNodes.reduce((total, childNode) => {
        const personData = childNode.personData as { entityCounts?: { addresses?: number; phones?: number; emails?: number; persons?: number; properties?: number; images?: number } };
        const entityCounts = personData?.entityCounts || {};
        return total + (entityCounts.addresses || 0) + (entityCounts.phones || 0) + 
               (entityCounts.emails || 0) + (entityCounts.persons || 0) + 
               (entityCounts.properties || 0) + (entityCounts.images || 0);
      }, 0);

      return {
        personCount: peopleData.people.length,
        childNodeCount: childNodes.length,
        totalChildEntities
      };
    } catch (error) {
      console.warn('Error parsing address stats:', error);
      return {
        personCount: 0,
        childNodeCount: 0,
        totalChildEntities: 0
      };
    }
  };

  if (skipTraceAddresses.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Mobile Header with Close Button */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-medium text-gray-900">Skip Trace Pins</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Session Selector Accordion */}
      <SessionSelectorAccordion
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={onNewSession}
        onSessionSwitch={onSessionSwitch}
      />

      {/* Skip Trace Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {isLoading ? 'Loading...' : `${skipTraceAddresses.length} Skip Trace Pin${skipTraceAddresses.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:bg-white focus:border-purple-300 transition-colors"
            />
          </div>
        </div>

        {/* Address List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading addresses...
            </div>
          ) : filteredAddresses.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              {searchTerm ? 'No addresses match your search' : 'No skip trace addresses found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAddresses.map((address) => {
                const stats = getAddressStats(address);
                return (
                  <div
                    key={address.id}
                    className="p-4 cursor-pointer hover:bg-purple-50 transition-colors"
                    onClick={() => handleAddressClick(address)}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {address.street}
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      {address.city}, {address.state} {address.zip}
                    </div>
                    
                    {/* Enhanced stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-xs text-blue-600 font-medium">
                              {stats.personCount} person{stats.personCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {stats.childNodeCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs text-green-600 font-medium">
                                {stats.childNodeCount} trace{stats.childNodeCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-gray-500">
                            {address.apiName}
                          </div>
                          {address.coordinates && (
                            <div className="text-xs text-green-600 font-medium">
                              ✓ Located
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {stats.totalChildEntities > 0 && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span className="text-xs text-purple-600 font-medium">
                            {stats.totalChildEntities} entities
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
