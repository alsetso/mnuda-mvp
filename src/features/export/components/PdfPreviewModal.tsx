'use client';

import { useState, useEffect, useCallback } from 'react';
import { pdfPreviewService } from '../services/pdfPreviewService';
import type { ExportData } from '../types/exportTypes';
import type { PdfColumnConfig } from '../types/columnConfig';
import { DEFAULT_COLUMN_CONFIG } from '../types/columnConfig';
import ColumnConfigPanel from './ColumnConfigPanel';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: ExportData | null;
  onExport: (columnConfig: PdfColumnConfig) => void;
}

export default function PdfPreviewModal({ isOpen, onClose, exportData, onExport }: PdfPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnConfig, setColumnConfig] = useState<PdfColumnConfig>(DEFAULT_COLUMN_CONFIG);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  useEffect(() => {
    if (isOpen && exportData) {
      generatePreview();
    } else {
      // Clean up URL when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    return () => {
      // Cleanup on unmount
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exportData]);

  const generatePreview = useCallback(async () => {
    if (!exportData) return;

    setIsGenerating(true);
    setError(null);

    try {
      const url = await pdfPreviewService.generatePreview(exportData, columnConfig);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  }, [exportData, columnConfig]);

  const handleExport = () => {
    onExport(columnConfig);
    onClose();
  };

  const handleConfigChange = (newConfig: PdfColumnConfig) => {
    setColumnConfig(newConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl mx-auto h-[95vh] sm:h-[90vh] flex flex-col sm:flex-row">
        {/* Configuration Panel - Hidden on mobile, overlay on larger screens */}
        {showConfigPanel && (
          <div className="absolute inset-0 z-10 sm:relative sm:z-auto sm:w-80 border-r border-gray-200 bg-gray-50 h-full flex flex-col">
            {/* Mobile Back Button */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 sm:hidden">
              <button
                onClick={() => setShowConfigPanel(false)}
                className="flex items-center gap-2 text-[#014463] hover:text-[#1dd1f5] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to Preview</span>
              </button>
              <h3 className="text-sm font-semibold text-gray-900">Configure Columns</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <ColumnConfigPanel
                config={columnConfig}
                onChange={handleConfigChange}
                onPreview={generatePreview}
              />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">PDF Preview</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
                Preview your session data before exporting
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  showConfigPanel 
                    ? 'bg-[#014463] text-white shadow-sm' 
                    : 'text-[#014463] bg-white border border-[#014463] hover:bg-[#014463] hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">
                  {showConfigPanel ? 'Hide Config' : 'Configure Columns'}
                </span>
                <span className="sm:hidden">
                  {showConfigPanel ? 'Hide' : 'Config'}
                </span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {isGenerating ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#014463] mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">Generating PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-red-500 mb-3 sm:mb-4">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-red-600 mb-3 sm:mb-4">{error}</p>
                <button
                  onClick={generatePreview}
                  className="px-3 sm:px-4 py-2 bg-[#014463] text-white rounded-md hover:bg-[#1dd1f5] transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="flex-1 p-2 sm:p-4 min-h-0">
              <iframe
                src={previewUrl}
                className="w-full h-full border border-gray-200 rounded-md sm:rounded-lg"
                title="PDF Preview"
              />
            </div>
          ) : null}
        </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">
              {exportData && (
                <>
                  {exportData.session.nodeCount} nodes • {exportData.session.entityCount} entities
                </>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-md transition-all duration-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={!previewUrl || isGenerating}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-[#014463] text-white hover:bg-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Exporting...</span>
                    <span className="sm:hidden">Exporting</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
