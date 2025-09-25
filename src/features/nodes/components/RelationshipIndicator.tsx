'use client';

import { NodeData } from '@/features/session/services/sessionStorage';

interface RelationshipIndicatorProps {
  node: NodeData;
  allNodes: NodeData[];
}

export default function RelationshipIndicator({ node, allNodes }: RelationshipIndicatorProps) {
  if (!node.mnNodeId) return null;

  const parentNode = node.parentNodeId 
    ? allNodes.find(n => n.mnNodeId === node.parentNodeId)
    : null;

  const childNodes = node.childMnudaIds 
    ? allNodes.filter(n => node.childMnudaIds?.includes(n.mnNodeId!))
    : [];

  return (
    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
      <div className="font-semibold text-gray-700 mb-1">🔗 Relationships</div>
      
      {/* Parent Relationship */}
      {parentNode && (
        <div className="mb-1">
          <span className="text-gray-500">Parent:</span>
          <span className="ml-1 text-blue-600">
            {parentNode.mnNodeId}
          </span>
        </div>
      )}
      
      {/* Children Relationships */}
      {childNodes.length > 0 && (
        <div className="mb-1">
          <span className="text-gray-500">Children:</span>
          <span className="ml-1 text-green-600">
            {childNodes.length} node{childNodes.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {/* Relationship Type */}
      {node.relationshipType && (
        <div className="mb-1">
          <span className="text-gray-500">Type:</span>
          <span className="ml-1 text-purple-600 capitalize">
            {node.relationshipType}
          </span>
        </div>
      )}
      
      {/* Entity Count */}
      {node.entityCount && node.entityCount > 0 && (
        <div>
          <span className="text-gray-500">Entities:</span>
          <span className="ml-1 text-orange-600">
            {node.entityCount}
          </span>
        </div>
      )}
    </div>
  );
}
