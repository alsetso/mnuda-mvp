// Hook for managing export functionality

import { useState, useCallback } from 'react';
import { exportService } from '../services/exportService';
import type { ExportFormat, ExportOptions } from '../types/exportTypes';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportSession = useCallback(async (format: ExportFormat, options?: Partial<ExportOptions>) => {
    setIsExporting(true);
    setExportError(null);

    try {
      const exportOptions: ExportOptions = {
        format,
        includeRawData: false,
        includeMetadata: true,
        groupByNode: true,
        ...options
      };

      const result = await exportService.exportSession(exportOptions);
      
      if (result.success && result.data) {
        // Download the file
        const url = URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true, filename: result.filename };
      } else {
        setExportError(result.error || 'Export failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const getAvailableFormats = useCallback(() => {
    return exportService.getAvailableFormats();
  }, []);

  return {
    exportSession,
    getAvailableFormats,
    isExporting,
    exportError,
    clearError: () => setExportError(null)
  };
}
