'use client';

import { useState, useEffect } from 'react';
import { PdfColumnConfig, DEFAULT_COLUMN_CONFIG, getEnabledColumns } from '../types/columnConfig';

interface ColumnConfigPanelProps {
  config: PdfColumnConfig;
  onChange: (config: PdfColumnConfig) => void;
  onPreview: () => void;
}

export default function ColumnConfigPanel({ config, onChange, onPreview }: ColumnConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<PdfColumnConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleColumnToggle = (columnId: keyof PdfColumnConfig) => {
    const newConfig = {
      ...localConfig,
      [columnId]: {
        ...localConfig[columnId],
        enabled: !localConfig[columnId].enabled
      }
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleWidthChange = (columnId: keyof PdfColumnConfig, width: number) => {
    const newConfig = {
      ...localConfig,
      [columnId]: {
        ...localConfig[columnId],
        width: Math.max(10, Math.min(200, width)) // Clamp between 10 and 200
      }
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleOrderChange = (columnId: keyof PdfColumnConfig, newOrder: number) => {
    const currentColumn = localConfig[columnId];
    const otherColumns = Object.entries(localConfig).filter(([id]) => id !== columnId);
    
    // Adjust other columns' order
    const updatedColumns = otherColumns.map(([, col]) => {
      if (col.order >= newOrder && col.order < currentColumn.order) {
        return { ...col, order: col.order + 1 };
      } else if (col.order <= newOrder && col.order > currentColumn.order) {
        return { ...col, order: col.order - 1 };
      }
      return col;
    });

    const newConfig = {
      ...localConfig,
      [columnId]: { ...currentColumn, order: newOrder },
      ...Object.fromEntries(updatedColumns.map(col => [col.id, col]))
    };
    
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleApply = () => {
    onChange(localConfig);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_COLUMN_CONFIG);
    setHasChanges(true);
  };

  const enabledColumns = getEnabledColumns(localConfig);
  const totalWidth = enabledColumns.reduce((sum, col) => sum + col.width, 0);

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Configure Columns</h3>
            <p className="text-xs text-gray-500">
              {enabledColumns.length} columns selected • Total width: {totalWidth}pt
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              Reset
            </button>
            {hasChanges && (
              <button
                onClick={handleApply}
                className="text-xs bg-[#1dd1f5] text-white px-3 py-1 rounded hover:bg-[#014463]"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Column List */}
      <div className="space-y-1 flex-1 overflow-y-auto">
        {Object.entries(localConfig)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([columnId, column]) => (
            <div
              key={columnId}
              className={`p-2 border rounded transition-colors ${
                column.enabled 
                  ? 'border-[#1dd1f5] bg-[#1dd1f5]/5' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Enable/Disable Toggle */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={column.enabled}
                    onChange={() => handleColumnToggle(columnId as keyof PdfColumnConfig)}
                    className="rounded border-gray-300 text-[#1dd1f5] focus:ring-[#1dd1f5] w-3 h-3"
                  />
                </label>

                {/* Column Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">
                      {column.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      #{column.order}
                    </span>
                  </div>
                  {column.description && (
                    <p className="text-xs text-gray-500 leading-tight">
                      {column.description}
                    </p>
                  )}
                </div>

                {/* Controls */}
                {column.enabled && (
                  <div className="flex items-center gap-1">
                    {/* Width Control */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-500">W:</label>
                      <input
                        type="number"
                        value={column.width}
                        onChange={(e) => handleWidthChange(
                          columnId as keyof PdfColumnConfig, 
                          parseInt(e.target.value) || 10
                        )}
                        className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                        min="10"
                        max="200"
                      />
                    </div>

                    {/* Order Control */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-500">O:</label>
                      <input
                        type="number"
                        value={column.order}
                        onChange={(e) => handleOrderChange(
                          columnId as keyof PdfColumnConfig,
                          parseInt(e.target.value) || 1
                        )}
                        className="w-8 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                        min="1"
                        max="9"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Preview Button */}
      <div className="flex-shrink-0 pt-2 border-t border-gray-200">
        <button
          onClick={onPreview}
          className="w-full px-4 py-2 text-sm font-medium text-[#1dd1f5] bg-white border border-[#1dd1f5] rounded-lg hover:bg-[#1dd1f5] hover:text-white transition-colors"
        >
          Update Preview
        </button>
      </div>
    </div>
  );
}
