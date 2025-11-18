'use client';

import { useState, useRef } from 'react';
import { ArrowRightIcon, ArrowLeftIcon, DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import type { CreditReportFile } from '../types';

interface CreditReportUploadStepProps {
  bureau: 'experian' | 'equifax' | 'transunion';
  initialFile: CreditReportFile | null;
  onUpload: (file: CreditReportFile) => void;
  onBack: () => void;
}

const bureauNames = {
  experian: 'Experian',
  equifax: 'Equifax',
  transunion: 'TransUnion',
};

export function CreditReportUploadStep({
  bureau,
  initialFile,
  onUpload,
  onBack,
}: CreditReportUploadStepProps) {
  const { user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<CreditReportFile | null>(initialFile);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      setUploadError('You must be logged in to upload files');
      return;
    }

    // Validate file type (PDF)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be smaller than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const fileExt = 'pdf';
      const fileName = `${user.id}/credit-reports/${bureau}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('credit-reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError(`Failed to upload file: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('credit-reports')
        .getPublicUrl(fileName);

      const creditReportFile: CreditReportFile = {
        file,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        url: urlData?.publicUrl,
      };

      setUploadedFile(creditReportFile);
      setUploadError(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    if (uploadedFile) {
      onUpload(uploadedFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          {bureauNames[bureau]} Credit Report
        </h2>
        <p className="text-gray-600 mb-6">
          Upload your full credit report from {bureauNames[bureau]}. Please ensure the file is a PDF and includes all pages of your report.
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {uploadedFile ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                <DocumentArrowUpIcon className="w-6 h-6 text-gold-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-black mb-1">{uploadedFile.fileName}</h3>
                <p className="text-sm text-gray-600">
                  {formatFileSize(uploadedFile.fileSize)} • Uploaded
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Remove file"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isUploading
              ? 'border-gold-500 bg-gold-50'
              : 'border-gray-300 hover:border-gold-500 cursor-pointer'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto">
                <DocumentArrowUpIcon className="w-8 h-8 text-gold-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-black mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-600">
                  PDF files only, max 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-black mb-2">How to get your credit report:</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Visit {bureauNames[bureau]}.com</li>
          <li>Request your free annual credit report</li>
          <li>Download the complete PDF report</li>
          <li>Upload the full document here</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!uploadedFile || isUploading}
          className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}



