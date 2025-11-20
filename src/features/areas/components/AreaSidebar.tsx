'use client';

import { Area } from '../services/areaService';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AreaSidebarProps {
  area: Area | null;
  isOpen: boolean;
  onClose: () => void;
  onEditDetails: (area: Area) => void;
  onEditShape: (area: Area) => void;
  onDelete: (area: Area) => void;
}

export function AreaSidebar({
  area,
  isOpen,
  onClose,
  onEditDetails,
  onEditShape,
  onDelete,
}: AreaSidebarProps) {
  if (!isOpen || !area) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-black text-black">{area.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {area.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Description</h3>
              <p className="text-gray-700">{area.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Category</h3>
            <p className="text-gray-700 capitalize">{area.category || 'custom'}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Visibility</h3>
            <p className="text-gray-700 capitalize">{area.visibility}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Created</h3>
            <p className="text-gray-700">
              {new Date(area.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => onEditDetails(area)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            Edit Details
          </button>
          <button
            onClick={() => onEditShape(area)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            Edit Shape
          </button>
          <button
            onClick={() => onDelete(area)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            Delete Area
          </button>
        </div>
      </div>
    </div>
  );
}

