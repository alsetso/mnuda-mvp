'use client';

import { useState } from 'react';
import { TrashIcon, PencilIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { AdService, type Ad } from '../index';
import { useToast } from '@/features/ui/hooks/useToast';
import { EditAdModal } from './EditAdModal';

interface AdCardProps {
  ad: Ad;
  onDelete: (adId: string) => void;
  onUpdate: () => void;
}

export function AdCard({ ad, onDelete, onUpdate }: AdCardProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { success, error: showError } = useToast();

  const handleDelete = async () => {
    try {
      await onDelete(ad.id);
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      showError('Failed to Delete', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleUpdate = async (data: Parameters<typeof AdService.updateAd>[1]) => {
    try {
      await AdService.updateAd(ad.id, data);
      success('Ad Updated', 'Your ad has been updated.');
      setIsEditModalOpen(false);
      onUpdate();
    } catch (err) {
      showError('Failed to Update', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const statusColors = {
    draft: 'bg-gray-200 text-gray-700',
    active: 'bg-green-200 text-green-700',
    paused: 'bg-yellow-200 text-yellow-700',
    expired: 'bg-red-200 text-red-700',
  };

  const placementLabels = {
    article_left: 'Left Side',
    article_right: 'Right Side',
    article_both: 'Both Sides',
  };

  return (
    <>
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="aspect-video bg-gray-100 relative">
          <img
            src={ad.image_url}
            alt={ad.headline}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[ad.status]}`}>
              {ad.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-black mb-1 line-clamp-2">
            {ad.headline}
          </h3>
          {ad.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {ad.description}
            </p>
          )}

          {/* Details */}
          <div className="space-y-2 mb-4 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Placement:</span>
              <span className="font-semibold text-black">{placementLabels[ad.placement]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Impressions:</span>
              <span className="font-semibold text-black">{ad.impression_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Clicks:</span>
              <span className="font-semibold text-black">{ad.click_count.toLocaleString()}</span>
            </div>
            {ad.impression_count > 0 && (
              <div className="flex items-center justify-between">
                <span>CTR:</span>
                <span className="font-semibold text-black">
                  {((ad.click_count / ad.impression_count) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-gold-100 hover:bg-gold-200 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              View
            </a>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-black mb-2">Delete Ad</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{ad.headline}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditAdModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ad={ad}
        onUpdateAd={handleUpdate}
      />
    </>
  );
}

