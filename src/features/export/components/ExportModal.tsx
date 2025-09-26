'use client';

import { useState } from 'react';
import { useExport } from '../hooks/useExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { exportSession, getAvailableFormats, isExporting, exportError, clearError } = useExport();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'xlsx' | 'pdf'>('csv');
  const [includeRawData, setIncludeRawData] = useState(false);
  const [customFilename, setCustomFilename] = useState('');

  const formats = getAvailableFormats();

  const handleExport = async () => {
    clearError();
    const result = await exportSession(selectedFormat, {
      includeRawData,
      filename: customFilename || undefined
    });
    
    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export Session Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
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
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedFormat === format.format
                      ? 'border-[#1dd1f5] bg-[#1dd1f5]/10 text-[#1dd1f5]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{format.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeRawData}
                  onChange={(e) => setIncludeRawData(e.target.checked)}
                  className="rounded border-gray-300 text-[#1dd1f5] focus:ring-[#1dd1f5]"
                />
                <span className="ml-2 text-sm text-gray-700">Include raw data</span>
              </label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
            />
          </div>

          {/* Error Display */}
          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">{exportError}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-2 bg-[#1dd1f5] text-white hover:bg-[#014463] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
