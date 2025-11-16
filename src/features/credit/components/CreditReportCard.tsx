'use client';

import { useState } from 'react';
import { DocumentIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import type { CreditReport } from '../types';

interface CreditReportCardProps {
  report: CreditReport;
}

const bureauNames = {
  experian: 'Experian',
  equifax: 'Equifax',
  transunion: 'TransUnion',
};

export function CreditReportCard({ report }: CreditReportCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parsing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    try {
      // Get signed URL for private file
      const { data, error } = await supabase.storage
        .from('credit-reports')
        .createSignedUrl(report.storagePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return;
      }

      setPreviewUrl(data.signedUrl);
      setIsPreviewing(true);
    } catch (error) {
      console.error('Error previewing report:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewing(false);
    setPreviewUrl(null);
  };

  return (
    <>
      <div className="group bg-white border-2 border-gold-200 rounded-xl p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200">
        <div className="flex flex-col gap-4">
          {/* Icon/Header */}
          <div className="w-full h-32 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
            <DocumentIcon className="w-12 h-12 text-gold-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-black group-hover:text-gold-600 transition-colors line-clamp-1 flex-1">
                {bureauNames[report.bureau]} Report
              </h3>
              <span className={`flex-shrink-0 px-2 py-1 border rounded text-xs font-semibold ${getStatusColor(report.parsingStatus)}`}>
                {report.parsingStatus}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <DocumentIcon className="w-4 h-4" />
                <span className="line-clamp-1">{report.fileName}</span>
              </div>
              
              {report.fileSize && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(report.fileSize)}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {new Date(report.uploadedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gold-200">
              <button
                onClick={handlePreview}
                disabled={isLoadingPreview}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPreview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4" />
                    <span>Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewing && previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleClosePreview}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-gold-200">
              <h2 className="text-xl font-bold text-black">
                {bureauNames[report.bureau]} Report Preview
              </h2>
              <button
                onClick={handleClosePreview}
                className="p-2 hover:bg-gold-100 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title={`${bureauNames[report.bureau]} Credit Report`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

