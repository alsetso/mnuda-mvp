'use client';

import { useState, useRef, useEffect } from 'react';
import { NodeData } from '../services/sessionStorage';
import { NodeStack } from '@/features/nodes';
import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity } from '@/features/api/services/personDetailParse';
import UnifiedDetailHeader from './UnifiedDetailHeader';
import { EntityActionFramework, ActionFrameworkConfig, ActionButton } from './EntityActionFramework';
import StructuredDataSection, { DetailSection, EntityDataFormatter } from './StructuredDataSection';
import UnifiedActionBar from './UnifiedActionBar';
import CompactNodeDetails from './CompactNodeDetails';

interface SessionResultsPanelProps {
  currentSession: { nodes: NodeData[] } | null;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onDeleteNode?: (nodeId: string) => void;
  onAddNode?: (node: NodeData) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  mobileView?: 'map' | 'results';
}

type ViewState = 'list' | 'detail' | 'entity';
type EntityData = PersonRecord | PersonDetailEntity;

export default function SessionResultsPanel({
  currentSession,
  onPersonTrace,
  onDeleteNode,
  onAddNode,
  onAddressIntel,
  mobileView = 'results'
}: SessionResultsPanelProps) {
  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityData | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle record click - transition to detail view
  const handleRecordClick = (node: NodeData) => {
    // Save current scroll position
    if (panelRef.current) {
      setScrollPosition(panelRef.current.scrollTop);
    }
    
    setSelectedNode(node);
    setSelectedEntity(null);
    setCurrentView('detail');
  };

  // Handle entity click - transition to entity detail view
  const handleEntityClick = (entity: EntityData) => {
    // Save current scroll position
    if (panelRef.current) {
      setScrollPosition(panelRef.current.scrollTop);
    }
    
    setSelectedEntity(entity);
    setSelectedNode(null);
    setCurrentView('entity');
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedNode(null);
    setSelectedEntity(null);
    
    // Restore scroll position after animation
    setTimeout(() => {
      if (panelRef.current) {
        panelRef.current.scrollTop = scrollPosition;
      }
    }, 300);
  };


  // Handle copy data
  const handleCopyData = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  // Handle rerun search
  const handleRerunSearch = (node: NodeData) => {
    // TODO: Implement rerun search functionality
    console.log('Rerun search for node:', node);
  };


  // Generate sections for entity detail view
  const getEntitySections = (entity: EntityData): DetailSection[] => {
    const sections: DetailSection[] = [];
    
    if (!('type' in entity)) {
      // PersonRecord
      sections.push({
        id: 'identity',
        title: 'Identity',
        icon: '',
        priority: 'high',
        collapsible: false,
        data: EntityDataFormatter.formatPersonIdentity(entity)
      });
      
      sections.push({
        id: 'location',
        title: 'Location History',
        icon: '',
        priority: 'medium',
        collapsible: true,
        data: EntityDataFormatter.formatPersonLocation(entity)
      });
    } else {
      // PersonDetailEntity
      switch (entity.type) {
        case 'person':
          sections.push({
            id: 'identity',
            title: 'Identity',
            icon: '',
            priority: 'high',
            collapsible: false,
            data: EntityDataFormatter.formatPersonIdentity(entity as unknown as PersonRecord)
          });
          break;
        case 'property':
          sections.push({
            id: 'property-details',
            title: 'Property Details',
            icon: '',
            priority: 'high',
            collapsible: false,
            data: EntityDataFormatter.formatPropertyDetails(entity)
          });
          break;
        case 'address':
          sections.push({
            id: 'address-details',
            title: 'Address Details',
            icon: '',
            priority: 'high',
            collapsible: false,
            data: EntityDataFormatter.formatAddressDetails(entity)
          });
          break;
        case 'phone':
        case 'email':
          sections.push({
            id: 'contact-info',
            title: 'Contact Information',
            icon: '',
            priority: 'high',
            collapsible: false,
            data: EntityDataFormatter.formatContactInfo(entity)
          });
          break;
        default:
          sections.push({
            id: 'entity-details',
            title: 'Entity Details',
            icon: '',
            priority: 'high',
            collapsible: false,
            data: {
              summary: 'Entity information',
              render: () => (
                <div className="space-y-2">
                  {Object.entries(entity).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">{key}:</span>
                      <span className="text-sm text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )
            }
          });
      }
    }
    
    // Add entity relationships section for all entity types
    sections.push({
      id: 'entity-relationships',
      title: 'Entity Relationships',
      icon: '',
      priority: 'medium',
      collapsible: true,
      data: EntityDataFormatter.formatEntityRelationships(entity)
    });
    
    return sections;
  };

  // Get actions for current context
  const getActions = (): ActionButton[] => {
    if (currentView === 'detail' && selectedNode) {
      const config: ActionFrameworkConfig = {
        entity: selectedNode as unknown as PersonRecord | PersonDetailEntity, // Type assertion for node
        node: selectedNode,
        onPersonTrace,
        onAddressIntel,
        onCopyData: handleCopyData,
        onDeleteNode,
        onRerunSearch: handleRerunSearch
      };
      return EntityActionFramework.getActions(config);
    }
    
    if (currentView === 'entity' && selectedEntity) {
      const config: ActionFrameworkConfig = {
        entity: selectedEntity,
        node: selectedNode || undefined,
        onPersonTrace,
        onAddressIntel,
        onCopyData: handleCopyData,
        onDeleteNode,
        onRerunSearch: handleRerunSearch
      };
      return EntityActionFramework.getActions(config);
    }
    
    return [];
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when the panel is focused or when in detail/entity view
      if ((currentView === 'detail' || currentView === 'entity') && event.key === 'Escape') {
        handleBackToList();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentView, handleBackToList]);

  // Handle delete from detail view
  const handleDeleteFromDetail = () => {
    if (selectedNode && onDeleteNode) {
      onDeleteNode(selectedNode.id);
      handleBackToList();
    }
  };

  // Handle person trace from entity detail view
  const handleEntityPersonTrace = async () => {
    if (!selectedEntity || !onPersonTrace) return;
    
    const personRecord = selectedEntity as PersonRecord;
    if (!personRecord.apiPersonId) return;

    try {
      // Call the person trace handler
      await onPersonTrace(
        personRecord.apiPersonId,
        personRecord,
        'Skip Trace',
        undefined, // parentNodeId
        personRecord.mnEntityId,
        personRecord
      );
      
      // Go back to list view to show the new node
      handleBackToList();
    } catch (error) {
      console.error('Person trace error:', error);
    }
  };

  // Render list view
  const renderListView = () => (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Results</h3>
            <p className="text-sm text-gray-500">
              {currentSession ? `${currentSession.nodes.length} result${currentSession.nodes.length !== 1 ? 's' : ''} found` : 'No session selected'}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Node Stack */}
            {currentSession && currentSession.nodes.length > 0 ? (
              <NodeStack
                nodes={currentSession.nodes}
                onPersonTrace={onPersonTrace}
                onDeleteNode={onDeleteNode}
                onAddNode={onAddNode}
                onRecordClick={handleRecordClick}
                onEntityClick={handleEntityClick}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h4>
                <p className="text-gray-500">
                  Click on the map to search addresses or use the floating menu to switch sessions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedNode) return null;
    
    const actions = getActions();
    
    return (
      <div className="transition-transform duration-300 ease-in-out h-full flex flex-col">
        {/* Unified Header */}
        <UnifiedDetailHeader
          title={selectedNode.customTitle || 'Record Details'}
          subtitle={selectedNode.type === 'api-result' ? 'Search Result' : 
                   selectedNode.type === 'userFound' ? 'Location Data' :
                   selectedNode.type === 'start' ? 'Input Data' : 'Record'}
          type="node"
          status="completed"
          onBack={handleBackToList}
        />

        {/* Main Content - Compact View */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <CompactNodeDetails node={selectedNode} />
            </div>
          </div>
        </div>

        {/* Unified Action Bar */}
        <UnifiedActionBar
          actions={actions}
          context={selectedNode.type === 'api-result' ? 'Search Result' : 
                   selectedNode.type === 'userFound' ? 'Location Data' :
                   selectedNode.type === 'start' ? 'Input Data' : 'Record'}
          timestamp={selectedNode.timestamp ? new Date(selectedNode.timestamp).toLocaleDateString() : undefined}
        />
      </div>
    );
  };

  // Render entity detail view
  const renderEntityDetailView = () => {
    if (!selectedEntity) return null;
    
    const entityType = 'type' in selectedEntity ? selectedEntity.type : 'person';
    const sections = getEntitySections(selectedEntity);
    const actions = getActions();
    
    // Get primary value for display
    const getPrimaryValue = (entity: EntityData): string => {
      if (!('type' in entity)) {
        return (entity as PersonRecord).name;
      }
      
      const detailEntity = entity as PersonDetailEntity;
      switch (detailEntity.type) {
        case 'address':
          const addr = detailEntity as Record<string, unknown>;
          return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postal || ''}`.replace(/^,\s*|,\s*$/g, '');
        case 'property':
          return typeof detailEntity.address === 'string' ? detailEntity.address : 'Property';
        case 'phone':
          return typeof detailEntity.number === 'string' ? detailEntity.number : 'Phone';
        case 'email':
          return typeof detailEntity.email === 'string' ? detailEntity.email : 'Email';
        case 'person':
          return typeof detailEntity.name === 'string' ? detailEntity.name : 'Person';
        case 'image':
          return 'Image';
        default:
          return 'Unknown';
      }
    };
    
    return (
      <div className="transition-transform duration-300 ease-in-out h-full flex flex-col">
        {/* Unified Header */}
        <UnifiedDetailHeader
          title={getPrimaryValue(selectedEntity)}
          subtitle={entityType === 'person' ? 'Person Record' : `${entityType} Entity`}
          type="entity"
          status="completed"
          entityType={entityType}
          onBack={handleBackToList}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {sections.map((section) => (
                <StructuredDataSection
                  key={section.id}
                  section={section}
                  isExpanded={true}
                  onToggle={() => {}}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Unified Action Bar */}
        <UnifiedActionBar
          actions={actions}
          context={entityType === 'person' ? 'Person Record' : `${entityType} Entity`}
        />
      </div>
    );
  };

  return (
    <>
      <div 
        ref={panelRef}
        className={`flex-1 min-w-0 bg-gray-50 border-l border-gray-200 h-full flex flex-col ${mobileView === 'map' ? 'hidden md:block' : ''}`}
      >
        {currentView === 'list' ? renderListView() : 
         currentView === 'detail' ? renderDetailView() : 
         renderEntityDetailView()}
      </div>
    </>
  );
}
