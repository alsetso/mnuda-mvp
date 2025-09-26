'use client';

import { useState } from 'react';
import ExportModal from '@/features/export/components/ExportModal';

interface MapNodeStackFooterProps {
  sessionName: string;
  nodeCount: number;
  entityCount: number;
}

export default function MapNodeStackFooter({ 
  sessionName, 
  nodeCount, 
  entityCount 
}: MapNodeStackFooterProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <>
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-900 truncate max-w-[200px]" title={sessionName}>
            {sessionName}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{entityCount} entit{entityCount !== 1 ? 'ies' : 'y'}</span>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors"
              title="Export session data"
            >
              <svg className="w-3 h-3 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <ExportModal
      isOpen={isExportModalOpen}
      onClose={() => setIsExportModalOpen(false)}
    />
    </>
  );
}
