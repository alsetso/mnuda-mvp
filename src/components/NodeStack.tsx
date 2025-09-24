'use client';

import { useState, useEffect } from 'react';
import AddressResultNode from '@/components/AddressResultNode';
import PropResultNode from '@/components/PropResultNode';
import PersonDetailNode from '@/components/PersonDetailNode';

interface NodeData {
  id: string;
  type: 'api-result' | 'people-result';
  address?: { street: string; city: string; state: string; zip: string };
  apiName: string;
  response?: unknown;
  personId?: string;
  personData?: unknown;
  timestamp: number;
}

interface NodeStackProps {
  nodes: NodeData[];
  onPersonTrace: (personId: string, personData: unknown, apiName: string) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }) => void;
}

export default function NodeStack({ nodes, onPersonTrace, onAddressIntel }: NodeStackProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Auto-expand the first node when nodes are added
  useEffect(() => {
    if (nodes.length > 0 && expandedNodes.size === 0) {
      setExpandedNodes(new Set([nodes[0].id]));
    }
  }, [nodes, expandedNodes.size]);

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
    let title = '';
    let subtitle = '';
    let component = null;

    if (nodeData.type === 'api-result') {
      title = nodeData.apiName;
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
          onPersonTrace={onPersonTrace}
        />
      );
    } else if (nodeData.type === 'people-result') {
      title = 'Person Details';
      subtitle = `Person ID: ${nodeData.personId}`;
      
      component = (
        <PersonDetailNode 
          personId={nodeData.personId!}
          personData={nodeData.personData}
          apiName={nodeData.apiName}
          onAddressIntel={onAddressIntel}
          onPersonTrace={onPersonTrace}
        />
      );
    }

    return {
      id: nodeData.id,
      title,
      subtitle,
      type: nodeData.type,
      component
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
              <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300 border-l-2 border-dashed border-gray-400 z-0"></div>
            )}
            
            {/* Node Header */}
            <div className="relative z-10">
              <button
                onClick={() => toggleNode(node.id)}
                className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-25 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      node.type === 'api-result' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-800">{node.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{node.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    node.type === 'api-result' 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {node.type === 'api-result' ? 'API Result' : 'Person Detail'}
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
              <div className="ml-6 border-l border-gray-200 pl-4">
                <div className="bg-white">
                  {node.component}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
