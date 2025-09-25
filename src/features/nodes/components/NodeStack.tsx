'use client';

import { useState, useEffect } from 'react';
import AddressResultNode from './AddressResultNode';
import PropResultNode from './PropResultNode';
import PersonDetailNode from './PersonDetailNode';
import StartNode from './StartNode';
import RelationshipIndicator from './RelationshipIndicator';
import TitleEdit from './TitleEdit';
import { sessionStorageService, NodeData } from '@/features/session/services/sessionStorage';

interface NodeStackProps {
  nodes: NodeData[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onAddressSearch?: (address: { street: string; city: string; state: string; zip: string }) => void;
  onStartNodeComplete?: (startNodeId: string) => void;
}

export default function NodeStack({ nodes, onPersonTrace, onAddressIntel, onAddressSearch, onStartNodeComplete }: NodeStackProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Handle title updates
  const handleTitleUpdate = (nodeId: string, newTitle: string) => {
    sessionStorageService.updateNodeTitle(nodeId, newTitle);
  };

  // Auto-expand the first node when nodes are added (only if no nodes are currently expanded)
  useEffect(() => {
    if (nodes.length > 0 && expandedNodes.size === 0) {
      setExpandedNodes(new Set([nodes[0].id]));
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
    let defaultTitle = '';
    let subtitle = '';
    let component = null;

    if (nodeData.type === 'start') {
      defaultTitle = 'Address Search';
      subtitle = 'Skip Trace API';
      
      component = (
        <StartNode 
          onAddressSearch={onAddressSearch || (() => {})}
          isSearching={false}
          hasCompleted={nodeData.hasCompleted || false}
        />
      );
    } else if (nodeData.type === 'api-result') {
      defaultTitle = nodeData.apiName;
      subtitle = nodeData.address ? `${nodeData.address.street}, ${nodeData.address.city}, ${nodeData.address.state} ${nodeData.address.zip}` : 'API Result';
      
      component = nodeData.apiName === 'Zillow Search' ? (
        <PropResultNode 
          address={nodeData.address!}
          propResponse={nodeData.response}
          apiName={nodeData.apiName}
        />
      ) : (
        <AddressResultNode
          address={nodeData.address!}
          apiResponse={nodeData.response}
          apiName={nodeData.apiName}
          onPersonTrace={(personId, personData, apiName) => onPersonTrace?.(personId, personData, apiName, nodeData.mnNodeId)}
        />
      );
    } else if (nodeData.type === 'people-result') {
      defaultTitle = 'Person Details';
      subtitle = `Person ID: ${nodeData.personId}`;
      
      console.log('NodeStack creating PersonDetailNode with nodeData:', {
        personId: nodeData.personId,
        apiName: nodeData.apiName,
        mnNodeId: nodeData.mnNodeId,
        clickedEntityId: nodeData.clickedEntityId,
        clickedEntityData: nodeData.clickedEntityData,
        fullNodeData: nodeData
      });
      
      component = (
        <PersonDetailNode
          personId={nodeData.personId!}
          personData={nodeData.personData}
          apiName={nodeData.apiName}
          mnudaId={nodeData.mnNodeId}
          clickedEntityId={nodeData.clickedEntityId}
          clickedEntityData={nodeData.clickedEntityData}
          onAddressIntel={onAddressIntel}
          onPersonTrace={(personId, personData, apiName, parentNodeId, entityId, entityData) => onPersonTrace?.(personId, personData, apiName, parentNodeId, entityId, entityData)}
        />
      );
    }

    // Use custom title if available, otherwise use default title
    const title = nodeData.customTitle || defaultTitle;

    return {
      id: nodeData.id,
      title,
      subtitle,
      type: nodeData.type,
      component,
      mnudaId: nodeData.mnNodeId
    };
  });

  if (displayNodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0">
      {displayNodes.map((node, index) => {
        const isExpanded = expandedNodes.has(node.id);
        const isLast = index === displayNodes.length - 1;
        
        return (
          <div key={node.id} className="relative">
            {/* Connection Line */}
            {!isLast && (
              <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-300 border-l-2 border-dashed border-gray-400 z-0"></div>
            )}
            
            {/* Node Header */}
            <div className="relative z-10">
              <button
                onClick={() => toggleNode(node.id)}
                className="w-full flex items-center justify-between p-3 bg-white border-b border-gray-100 hover:bg-gray-25 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      node.type === 'start' ? 'bg-blue-500' :
                      node.type === 'api-result' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <TitleEdit
                      title={node.title}
                      onSave={(newTitle) => handleTitleUpdate(node.id, newTitle)}
                      className="mb-0.5"
                      placeholder="Enter node title..."
                    />
                    <p className="text-xs text-gray-400 mt-0.5">{node.subtitle}</p>
                    {node.mnudaId && (
                      <p className="text-xs text-blue-600 mt-0.5 font-mono">ID: {node.mnudaId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    node.type === 'start' 
                      ? 'bg-blue-50 text-blue-700'
                      : node.type === 'api-result' 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {node.type === 'start' ? 'Start Node' : 
                     node.type === 'api-result' ? 'API Result' : 'Person Detail'}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            </div>
            
            {/* Node Content */}
            {isExpanded && (
              <div className="ml-6 border-l border-gray-200 pl-3">
                <div className="bg-white">
                  {node.component}
                  {/* Relationship Indicator */}
                  <RelationshipIndicator node={nodes.find(n => n.id === node.id)!} allNodes={nodes} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
