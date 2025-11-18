'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type CreditItemType = 'report' | 'negative' | 'letter';

interface CreditItemDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemType: CreditItemType;
  itemName: string;
  itemDetails?: string; // Additional details to show (e.g., bureau, account name)
}

const itemTypeConfig: Record<CreditItemType, { label: string; description: string }> = {
  report: {
    label: 'Credit Report',
    description: 'Deleting this credit report will permanently remove it and all associated parsed data. This action cannot be undone.',
  },
  negative: {
    label: 'Negative Item',
    description: 'Deleting this negative item will permanently remove it from your credit profile. This action cannot be undone.',
  },
  letter: {
    label: 'Credit Letter',
    description: 'Deleting this credit letter will permanently remove it from your records. This action cannot be undone.',
  },
};

export function CreditItemDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  itemDetails,
}: CreditItemDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const config = itemTypeConfig[itemType];

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by parent component
      console.error('Error in delete modal:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Delete {config.label}</h2>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <span className="font-semibold text-black">"{itemName}"</span>?
            </p>
            {itemDetails && (
              <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Details:</span> {itemDetails}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                `Delete ${config.label}`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



