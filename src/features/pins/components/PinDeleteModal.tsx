'use client';

import { useState } from 'react';
import { useToast } from '@/features/ui/hooks/useToast';
import { Pin } from '../services/pinService';

interface PinDeleteModalProps {
  isOpen: boolean;
  pin: Pin | null;
  onClose: () => void;
  onDelete: (pinId: string) => Promise<void>;
}

export function PinDeleteModal({
  isOpen,
  pin,
  onClose,
  onDelete,
}: PinDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { error } = useToast();

  const handleDelete = async () => {
    if (!pin) return;

    setIsDeleting(true);
    try {
      await onDelete(pin.id);
      onClose();
    } catch (err) {
      error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete pin');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !pin) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Delete Pin</h2>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{pin.emoji} {pin.name}</strong>? This action cannot be undone.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-1">Address:</div>
                <div>{pin.address}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                  'Delete Pin'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

