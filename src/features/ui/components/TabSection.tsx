'use client';

import { useState } from 'react';
import { NodeData } from '@/features/session/services/sessionStorage';
import SkipMap from '@/features/map/components/SkipMap';
import NodeStack from '@/features/nodes/components/NodeStack';

interface TabSectionProps {
  nodes: NodeData[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onAddressSearch?: (address: { street: string; city: string; state: string; zip: string }) => void;
  onStartNodeComplete?: () => void;
}

export default function TabSection({ 
  nodes, 
  onPersonTrace, 
  onAddressIntel, 
  onAddressSearch, 
  onStartNodeComplete 
}: TabSectionProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  const tabs = [
    { id: 'list' as const, label: 'List View', icon: '📋' },
    { id: 'map' as const, label: 'SkipMap', icon: '🗺️' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-1 sm:flex-none
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white">
        {activeTab === 'list' && (
          <div className="p-4 sm:p-6">
            {/* List View Content - Use the existing NodeStack */}
            <NodeStack 
              nodes={nodes}
              onPersonTrace={onPersonTrace}
              onAddressIntel={onAddressIntel}
              onAddressSearch={onAddressSearch}
              onStartNodeComplete={onStartNodeComplete}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[70vh] min-h-[400px] sm:min-h-[500px] max-h-[800px] relative">
            <SkipMap nodes={nodes} />
          </div>
        )}
      </div>
    </div>
  );
}
