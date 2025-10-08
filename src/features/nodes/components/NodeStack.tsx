'use client';

import { useState, useEffect, useRef } from 'react';
import SkipTraceResultNode from './SkipTraceResultNode';
import PropResultNode from './PropResultNode';
import PersonDetailNode from './PersonDetailNode';
import StartNode from './StartNode';
import UserFoundNode from './UserFoundNode';
import InputNode from './InputNode';
import RelationshipIndicator from './RelationshipIndicator';
import TitleEdit from './TitleEdit';
import AddNode from './AddNode';
import { sessionStorageService, NodeData } from '@/features/session/services/sessionStorage';
import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity } from '@/features/api/services/personDetailParse';
import { generateNodeTitle } from '@/features/nodes/utils/nodeTitleUtils';

interface NodeStackProps {
  nodes: NodeData[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onAddressSearch?: (address: { street: string; city: string; state: string; zip: string }) => void;
  onNameSearch?: (nameData: { firstName: string; middleInitial?: string; lastName: string }) => void;
  onEmailSearch?: (emailData: { email: string }) => void;
  onPhoneSearch?: (phoneData: { phone: string }) => void;
  onZillowSearch?: (addressData: { street: string; city: string; state: string; zip: string }) => void;
  onStartNodeComplete?: (startNodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onAddNode?: (node: NodeData) => void;
  onStartNodeAddressChanged?: (address: { street: string; city: string; state: string; zip: string }) => Promise<void>;
  onUserFoundLocationFound?: (nodeId: string, coords: { lat: number; lng: number }, address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } }) => void;
  onUserFoundStartTracking?: () => void;
  onUserFoundStopTracking?: () => void;
  onCreateNewLocationSession?: () => void;
  onContinueToAddressSearch?: () => void;
  onRecordClick?: (node: NodeData) => void;
  onEntityClick?: (entity: PersonRecord | PersonDetailEntity) => void;
  isTracking?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export default function NodeStack({ 
  nodes, 
  onPersonTrace, 
  onAddressIntel, 
  onAddressSearch, 
  onNameSearch,
  onEmailSearch,
  onPhoneSearch,
  onZillowSearch,
  onStartNodeComplete, 
  onDeleteNode, 
  onAddNode,
  onStartNodeAddressChanged,
  onUserFoundLocationFound,
  onUserFoundStartTracking,
  onUserFoundStopTracking,
  onCreateNewLocationSession,
  onContinueToAddressSearch,
  onRecordClick,
  onEntityClick,
  isTracking,
  userLocation
}: NodeStackProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle title updates
  const handleTitleUpdate = (nodeId: string, newTitle: string) => {
    sessionStorageService.updateNodeTitle(nodeId, newTitle);
  };

  // Handle scrolling to a newly created node
  const handleNodeCreated = (nodeId: string) => {
    // Auto-expand the new node
    setExpandedNodes(prev => new Set([...prev, nodeId]));
    
    // Scroll to the top of the container to show the newest node (which is now at the top)
    setTimeout(() => {
      const container = document.querySelector('.space-y-0');
      if (container) {
        container.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // Auto-expand the most recent node when nodes are added (only if no nodes are currently expanded)
  useEffect(() => {
    if (nodes.length > 0 && expandedNodes.size === 0) {
      // Prioritize search history nodes, otherwise get the most recent node
      const searchHistoryNode = nodes.find(node => 
        node.type === 'start' && node.apiName === 'Search History'
      );
      
      if (searchHistoryNode) {
        setExpandedNodes(new Set([searchHistoryNode.id]));
      } else {
        // Get the most recent node (last in the array, which will be first in the reversed display)
        const mostRecentNode = nodes[nodes.length - 1];
        setExpandedNodes(new Set([mostRecentNode.id]));
      }
    }
  }, [nodes, expandedNodes.size]);

  // Check if start node should be completed when new API results are added
  useEffect(() => {
    if (nodes.length >= 2) {
      const startNode = nodes[0];
      const firstResultNode = nodes[1];
      
      // If first node is start and second is api-result with people data
      if (startNode.type === 'start' && 
          firstResultNode.type === 'api-result' && 
          firstResultNode.apiName === 'Skip Trace' &&
          firstResultNode.response) {
        
        // Check if the response has people data with records
        const response = firstResultNode.response as Record<string, unknown>;
        if (response.people && Array.isArray(response.people) && response.people.length > 0) {
          // Mark start node as completed and collapse it
          if (onStartNodeComplete) {
            onStartNodeComplete(startNode.id);
          }
          // Collapse the start node
          setExpandedNodes(prev => {
            const newSet = new Set(prev);
            newSet.delete(startNode.id);
            return newSet;
          });
        }
      }
    }
  }, [nodes, onStartNodeComplete]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Convert NodeData array to display nodes
  const displayNodes = nodes.map((nodeData) => {
    // Debug: ensure nodeData has valid ID
    if (!nodeData.id) {
      console.warn('NodeData missing ID:', nodeData);
    }
    let defaultTitle = '';
    let subtitle = '';
    let component = null;

    if (nodeData.type === 'userFound') {
      defaultTitle = 'User Location';
      subtitle = 'Location Services';
      
      component = (
        <UserFoundNode 
          onLocationFound={(coords, address) => onUserFoundLocationFound?.(nodeData.id, coords, address)}
          onStartTracking={onUserFoundStartTracking || (() => {})}
          onStopTracking={onUserFoundStopTracking}
          onCreateNewLocationSession={onCreateNewLocationSession}
          onContinueToAddressSearch={onContinueToAddressSearch}
          isTracking={isTracking || false}
          userLocation={userLocation}
          status={nodeData.status || 'pending'}
          hasCompleted={nodeData.hasCompleted || false}
          payload={nodeData.payload}
        />
      );
    } else if (nodeData.type === 'start') {
      // Check if this is a search history node
      if (nodeData.apiName === 'Search History') {
        defaultTitle = nodeData.customTitle || 'Search History';
        subtitle = nodeData.address ? `${nodeData.address.street}, ${nodeData.address.city}, ${nodeData.address.state} ${nodeData.address.zip}` : 'Search History';
        
        // Create a simple display component for search history
        component = (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#1dd1f5]/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Search Completed</p>
                <p className="text-sm text-gray-500">
                  {nodeData.address ? `${nodeData.address.street}, ${nodeData.address.city}, ${nodeData.address.state} ${nodeData.address.zip}` : 'Location searched'}
                </p>
                {nodeData.address?.coordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {nodeData.address.coordinates.latitude.toFixed(6)}, {nodeData.address.coordinates.longitude.toFixed(6)}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
          </div>
        );
      } else {
        // Check if this is a new input node type based on customTitle
        const customTitle = nodeData.customTitle;
        if (customTitle && customTitle !== 'Address Search') {
          // This is a new input node type
          const nodeTypeMap: Record<string, 'name' | 'email' | 'phone' | 'address' | 'zillow'> = {
            'Name Search': 'name',
            'Email Search': 'email',
            'Phone Search': 'phone',
            'Address Search': 'address',
            'Zillow Search': 'zillow'
          };
          
          const nodeType = nodeTypeMap[customTitle];
          if (nodeType) {
            defaultTitle = customTitle;
            subtitle = nodeType === 'zillow' ? 'Zillow API' : 'Skip Trace API';
            
            component = (
              <InputNode
                nodeType={nodeType}
                onSearch={(searchData) => {
                  // Handle the search based on node type using the proper handlers
                  switch (nodeType) {
                    case 'name':
                      onNameSearch?.(searchData as { firstName: string; middleInitial?: string; lastName: string });
                      break;
                    case 'email':
                      onEmailSearch?.(searchData as { email: string });
                      break;
                    case 'phone':
                      onPhoneSearch?.(searchData as { phone: string });
                      break;
                    case 'address':
                      onAddressSearch?.(searchData as { street: string; city: string; state: string; zip: string });
                      break;
                    case 'zillow':
                      onZillowSearch?.(searchData as { street: string; city: string; state: string; zip: string });
                      break;
                  }
                }}
                isSearching={false}
                hasCompleted={nodeData.hasCompleted || false}
                initialData={{}}
              />
            );
          } else {
            // Fallback to original address search node
            defaultTitle = 'Address Search';
            subtitle = 'Skip Trace API';
            
            component = (
              <StartNode 
                onAddressSearch={onAddressSearch || (() => {})}
                isSearching={false}
                hasCompleted={nodeData.hasCompleted || false}
                initialAddress={nodeData.address}
                onAddressChanged={onStartNodeAddressChanged}
              />
            );
          }
        } else {
          // This is the original address search node
          defaultTitle = 'Address Search';
          subtitle = 'Skip Trace API';
          
          component = (
            <StartNode 
              onAddressSearch={onAddressSearch || (() => {})}
              isSearching={false}
              hasCompleted={nodeData.hasCompleted || false}
              initialAddress={nodeData.address}
              onAddressChanged={onStartNodeAddressChanged}
            />
          );
        }
      }
    } else if (nodeData.type === 'api-result') {
      defaultTitle = nodeData.apiName || 'API Result';
      subtitle = nodeData.address ? `${nodeData.address.street}, ${nodeData.address.city}, ${nodeData.address.state} ${nodeData.address.zip}` : 'API Result';
      
      component = nodeData.apiName === 'Zillow Search' ? (
        <PropResultNode 
          address={nodeData.address || { street: '', city: '', state: '', zip: '' }}
          propResponse={nodeData.response}
          apiName={nodeData.apiName || 'API Result'}
        />
      ) : (
        <SkipTraceResultNode
          address={nodeData.address || { street: '', city: '', state: '', zip: '' }}
          apiResponse={nodeData.response}
          apiName={nodeData.apiName || 'API Result'}
          onPersonTrace={(personId, personData, apiName, parentNodeId, entityId, entityData) => onPersonTrace?.(personId, personData, apiName, parentNodeId, entityId, entityData)}
          onEntityClick={onEntityClick}
          node={nodeData}
          allNodes={nodes}
        />
      );
    } else if (nodeData.type === 'people-result') {
      defaultTitle = 'Person Details';
      subtitle = 'Individual Profile';
      
      component = (
        <PersonDetailNode
          personId={nodeData.personId!}
          personData={nodeData.personData}
          apiName={nodeData.apiName || 'API Result'}
          mnudaId={nodeData.mnNodeId}
          clickedEntityId={nodeData.clickedEntityId}
          clickedEntityData={nodeData.clickedEntityData}
          onAddressIntel={onAddressIntel}
          onPersonTrace={(personId, personData, apiName, parentNodeId, entityId, entityData) => onPersonTrace?.(personId, personData, apiName, parentNodeId, entityId, entityData)}
          onEntityClick={onEntityClick}
        />
      );
    }

    // Use custom title if available, otherwise generate automatic title, fallback to default
    const title = nodeData.customTitle || generateNodeTitle(nodeData) || defaultTitle;

    return {
      id: nodeData.id,
      title,
      subtitle,
      type: nodeData.type,
      component,
      mnudaId: nodeData.mnNodeId,
      timestamp: nodeData.timestamp,
      mnNodeId: nodeData.mnNodeId
    };
  });

  if (displayNodes.length === 0) {
    return null;
  }

  // Filter out any nodes without valid IDs
  const validDisplayNodes = displayNodes.filter(node => node.id);

  if (validDisplayNodes.length === 0) {
    return null;
  }

  // Default status indicator for all nodes
  const getNodeStatusColor = (): string => {
    return 'bg-[#014463]';
  };

  return (
    <div className="space-y-0 w-full max-w-full overflow-hidden">
      {/* Add Node Button - positioned above the nodes */}
      {onAddNode && (
        <div className="flex justify-center mb-4">
          <AddNode onAddNode={onAddNode} onNodeCreated={handleNodeCreated} />
        </div>
      )}
      
      {(() => {
        // Separate search history nodes from other nodes
        const searchHistoryNodes = validDisplayNodes.filter(node => 
          node.type === 'start' && (node as Record<string, unknown>).apiName === 'Search History'
        );
        const otherNodes = validDisplayNodes.filter(node => 
          !(node.type === 'start' && (node as Record<string, unknown>).apiName === 'Search History')
        );
        
        // Search history nodes stay at top, other nodes are reversed
        const orderedNodes = [...searchHistoryNodes, ...otherNodes.slice().reverse()];
        
        return orderedNodes.map((node, index) => {
        const isExpanded = expandedNodes.has(node.id);
        const isLast = index === orderedNodes.length - 1;
        
        // Ensure we have a unique key by combining ID with index to handle duplicates
        const nodeKey = `${node.id}-${index}`;
        
        return (
          <div 
            key={nodeKey} 
            ref={(el) => {
              if (el) {
                nodeRefs.current.set(node.id, el);
              } else {
                nodeRefs.current.delete(node.id);
              }
            }}
            className="relative"
          >
            {/* Connection Line */}
            {!isLast && (
              <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-300 border-l-2 border-dashed border-gray-200 z-0"></div>
            )}
            
            {/* Node Header */}
            <div className="relative z-10">
              <div className="flex items-center bg-transparent border-b border-gray-200">
                <div 
                  className={`flex items-center space-x-3 flex-1 p-3 ${onRecordClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={onRecordClick ? () => onRecordClick(nodes.find(n => n.id === node.id)!) : undefined}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${getNodeStatusColor()}`}></div>
                  </div>
                  <div className="text-left min-w-0 flex-1 max-w-[200px]">
                    <TitleEdit
                      title={node.title}
                      onSave={(newTitle) => handleTitleUpdate(node.id, newTitle)}
                      className="mb-0.5"
                      placeholder="Enter node title..."
                    />
                    {node.mnudaId && (
                      <p className="text-xs text-[#014463] font-mono">ID: {node.mnudaId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleNode(node.id)}
                    className="p-2 text-gray-500 hover:text-[#014463] transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Delete Button */}
                  {onDeleteNode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this node?')) {
                          onDeleteNode(node.id);
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete node"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Node Content */}
            {isExpanded && (
              <div className="ml-6 border-l border-gray-200 pl-3 w-full max-w-full overflow-hidden">
                <div className="bg-transparent w-full max-w-full overflow-hidden">
                  <div className="w-full max-w-full overflow-hidden">
                    {node.component}
                  </div>
                  {/* Relationship Indicator - Hide for UserFoundNode, SkipTraceResultNode, and search nodes (start type) */}
                  {node.type !== 'userFound' && node.type !== 'api-result' && node.type !== 'start' && (
                    <RelationshipIndicator node={nodes.find(n => n.id === node.id)!} allNodes={nodes} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
        });
      })()}
    </div>
  );
}
