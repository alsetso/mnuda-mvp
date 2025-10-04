'use client';

import { useState } from 'react';
import { useExport } from '../hooks/useExport';
import PdfPreviewModal from './PdfPreviewModal';
import { PdfColumnConfig } from '../types/columnConfig';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { exportSession, getAvailableFormats, getExportData, isExporting, exportError, clearError } = useExport();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'xlsx' | 'pdf'>('csv');
  const [customFilename, setCustomFilename] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formats = getAvailableFormats();

  const handleExport = async () => {
    clearError();
    const result = await exportSession(selectedFormat, {
      filename: customFilename || undefined
    });
    
    if (result.success) {
      onClose();
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePreviewExport = async (columnConfig: PdfColumnConfig) => {
    clearError();
    const result = await exportSession('pdf', {
      filename: customFilename || undefined
    }, columnConfig);
    
    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#014463] rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Export Session Data</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((format) => (
                <button
                  key={format.format}
                  onClick={() => setSelectedFormat(format.format)}
                  className={`p-2 text-left border rounded-md transition-all duration-200 ${
                    selectedFormat === format.format
                      ? 'border-[#014463] bg-[#014463]/5 text-[#014463]'
                      : 'border-gray-200 hover:border-[#014463]/30 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-xs">{format.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{format.description}</div>
                </button>
              ))}
            </div>
          </div>


          {/* Custom Filename */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Filename (optional)
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Leave empty for auto-generated name"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#014463] focus:border-[#014463] transition-colors text-sm"
            />
          </div>

          {/* Error Display */}
          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-red-700 font-medium">{exportError}</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 p-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-md transition-all duration-200 text-sm font-medium"
          >
            Cancel
          </button>
          {selectedFormat === 'pdf' && (
            <button
              onClick={handlePreview}
              className="px-4 py-2 text-[#014463] bg-white border border-[#014463] hover:bg-[#014463] hover:text-white rounded-md transition-all duration-200 text-sm font-medium"
            >
              Preview
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-3 py-2 bg-[#014463] text-white hover:bg-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5"
          >
            {isExporting ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        exportData={getExportData()}
        onExport={handlePreviewExport}
      />
    </div>
  );
}
