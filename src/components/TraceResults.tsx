'use client';

import { useState } from 'react';
import { NodeData } from '@/features/session/services/sessionStorage';

interface TraceResultsProps {
  nodes: NodeData[];
  onNodeClick?: (node: NodeData) => void;
}

export default function TraceResults({ nodes, onNodeClick }: TraceResultsProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNodeExpansion = (nodeId: string) => {
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

  const isNodeExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  // Get detailed node data for expansion
  const getDetailedNodeData = (node: NodeData) => {
    try {
      const data = typeof node.response === 'string' ? JSON.parse(node.response) : node.response;
      return data;
    } catch {
      return {};
    }
  };

  // Render detailed node information
  const renderNodeDetails = (node: NodeData) => {
    const data = getDetailedNodeData(node);
    const isExpanded = isNodeExpanded(node.id);

    if (!isExpanded) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="space-y-3">
          {/* Raw data display */}
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Raw Data</h5>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>

          {/* Node metadata */}
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Node Information</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono text-gray-700">{node.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-700">{node.type}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-700">{new Date(node.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2 text-gray-700">{new Date(node.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* API-specific information */}
          {node.type === 'api-result' && (
            <div>
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">API Information</h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">API Name:</span>
                  <span className="ml-2 text-gray-700">{node.apiName || 'Unknown'}</span>
                </div>
                {node.address && (
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <span className="ml-2 text-gray-700">
                      {node.address.street}, {node.address.city}, {node.address.state} {node.address.zip}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No traces yet</h3>
        <p className="text-gray-600">Submit a trace above to see results here</p>
      </div>
    );
  }

  // Get node type styling - matching EntityCard logic
  const getTypeLabelColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-slate-100 text-slate-600';
      case 'address': return 'bg-slate-100 text-slate-600';
      case 'phone': return 'bg-slate-100 text-slate-600';
      case 'email': return 'bg-slate-100 text-slate-600';
      case 'person': return 'bg-blue-100 text-blue-800';
      case 'api-result': return 'bg-green-100 text-green-800';
      case 'people-result': return 'bg-purple-100 text-purple-800';
      case 'start': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Get node type icon
  const getNodeTypeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'person':
      case 'people-result':
        return '👤';
      case 'address':
        return '🏠';
      case 'phone':
        return '📞';
      case 'email':
        return '📧';
      case 'api-result':
        return '🔍';
      case 'start':
        return '🚀';
      default:
        return '📄';
    }
  };

  // Get node type label
  const getNodeTypeLabel = (nodeType: string) => {
    switch (nodeType) {
      case 'person':
      case 'people-result':
        return 'Person';
      case 'address':
        return 'Address';
      case 'phone':
        return 'Phone';
      case 'email':
        return 'Email';
      case 'api-result':
        return 'API Result';
      case 'start':
        return 'Input';
      default:
        return 'Result';
    }
  };

  // Format node data - using same logic as map page
  const formatNodeData = (node: NodeData) => {
    try {
      const data = typeof node.response === 'string' ? JSON.parse(node.response) : node.response;
      
      // Handle different node types like the map page
      if (node.type === 'api-result') {
        return {
          primary: node.apiName || 'API Result',
          secondary: node.address ? `${node.address.street}, ${node.address.city}, ${node.address.state} ${node.address.zip}` : 'API Result'
        };
      } else if (node.type === 'people-result') {
        return {
          primary: data.name || data.full_name || 'Person Details',
          secondary: 'Individual Profile'
        };
      } else if (node.type === 'start') {
        const customTitle = node.customTitle || 'Input';
        return {
          primary: customTitle,
          secondary: customTitle === 'Zillow Search' ? 'Zillow API' : 'Skip Trace API'
        };
      } else {
        // Handle trace input nodes
        if (data.name || data.full_name) {
          return {
            primary: data.name || data.full_name,
            secondary: data.email || data.phone || data.address || 'Person found'
          };
        } else if (data.email) {
          return {
            primary: data.email,
            secondary: data.name || data.full_name || 'Email address'
          };
        } else if (data.phone) {
          return {
            primary: data.phone,
            secondary: data.name || data.full_name || 'Phone number'
          };
        } else if (data.address) {
          return {
            primary: data.address,
            secondary: data.city || data.state || 'Property address'
          };
        } else {
          return {
            primary: `Trace Result ${node.id.slice(-4)}`,
            secondary: 'Data found'
          };
        }
      }
    } catch {
      return {
        primary: `Trace Result ${node.id.slice(-4)}`,
        secondary: 'Data found'
      };
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl shadow-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Trace Results</h3>
        <p className="text-gray-600">{nodes.length} result{nodes.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="space-y-3">
        {nodes.map((node) => {
          const displayData = formatNodeData(node);
          const isExpanded = isNodeExpanded(node.id);
          
          return (
            <div
              key={node.id}
              className="rounded-lg border border-gray-200 hover:border-[#1dd1f5] transition-colors"
            >
              {/* Main node content */}
              <div
                onClick={() => onNodeClick?.(node)}
                className={`p-4 ${onNodeClick ? 'cursor-pointer hover:bg-[#1dd1f5]/5' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#1dd1f5]/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{getNodeTypeIcon(node.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {displayData.primary}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeLabelColor(node.type)}`}>
                          {getNodeTypeLabel(node.type)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNodeExpansion(node.id);
                          }}
                          className="p-1 text-gray-400 hover:text-[#1dd1f5] transition-colors"
                          title={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          <svg 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {displayData.secondary}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {node.type === 'start' ? 'Created' : 'Traced'} {new Date(node.timestamp).toLocaleDateString()} at {new Date(node.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {onNodeClick && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable details */}
              {renderNodeDetails(node)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
