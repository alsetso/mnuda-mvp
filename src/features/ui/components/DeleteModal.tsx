'use client';

import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type DeleteEntityType = 'listing';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: DeleteEntityType;
  entityName: string;
  isDeleting?: boolean;
}

const entityConfig: Record<DeleteEntityType, { label: string; description: string }> = {
  listing: {
    label: 'Listing',
    description: 'Deleting this listing will permanently remove it from the market. This action cannot be undone.',
  },
};

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  isDeleting = false,
}: DeleteModalProps) {
  const config = entityConfig[entityType];

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // Error handling is done by parent component
      console.error('Error deleting:', err);
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
              Are you sure you want to delete <span className="font-semibold text-black">"{entityName}"</span>?
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete {config.label}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

