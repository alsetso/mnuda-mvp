'use client';

import { useState, useRef, DragEvent } from 'react';
import { DocumentArrowUpIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { CreditRestorationService } from '../services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';

interface CreditReportUploadProps {
  creditProfileId: string;
  onUploadComplete: () => void;
}

const bureaus = [
  { value: 'experian' as const, label: 'Experian' },
  { value: 'equifax' as const, label: 'Equifax' },
  { value: 'transunion' as const, label: 'TransUnion' },
];

export function CreditReportUpload({ creditProfileId, onUploadComplete }: CreditReportUploadProps) {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [selectedBureau, setSelectedBureau] = useState<'experian' | 'equifax' | 'transunion' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type (PDF)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showError('File must be smaller than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBureau || !user) {
      showError('Please select a bureau and file');
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = 'pdf';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const storagePath = `${user.id}/credit-reports/${selectedBureau}/${timestamp}-${randomStr}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('credit-reports')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Create credit report record
      await CreditRestorationService.uploadCreditReport(
        creditProfileId,
        selectedBureau,
        storagePath,
        selectedFile.name,
        selectedFile.size
      );

      success('Credit report uploaded successfully');
      
      // Reset form
      setSelectedFile(null);
      setSelectedBureau(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh reports list
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading credit report:', error);
      showError(error instanceof Error ? error.message : 'Failed to upload credit report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white border-2 border-gold-200 rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-black mb-4">Upload Credit Report</h2>
      
      <div className="space-y-4">
        {/* Bureau Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Credit Bureau
          </label>
          <div className="grid grid-cols-3 gap-3">
            {bureaus.map((bureau) => (
              <button
                key={bureau.value}
                type="button"
                onClick={() => setSelectedBureau(bureau.value)}
                className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all ${
                  selectedBureau === bureau.value
                    ? 'border-gold-500 bg-gold-50 text-black'
                    : 'border-gold-200 bg-white text-gray-700 hover:border-gold-300'
                }`}
              >
                {bureau.label}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        {selectedBureau && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload PDF Report
            </label>
            
            {!selectedFile ? (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-gold-200 hover:border-gold-300 bg-gold-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudArrowUpIcon className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Drag and drop your PDF here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  PDF files only, max 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                      <DocumentArrowUpIcon className="w-6 h-6 text-gold-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black mb-1">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1 hover:bg-gold-100 rounded transition-colors"
                    aria-label="Remove file"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        {selectedBureau && selectedFile && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Upload Report</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

