'use client';

import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Area } from '../services/areaService';
import { useAuth } from '@/features/auth';

interface AreaSidebarProps {
  area: Area | null;
  isOpen: boolean;
  onClose: () => void;
  onEditDetails?: (area: Area) => void;
  onEditShape?: (area: Area) => void;
  onDelete?: (area: Area) => void;
}

export function AreaSidebar({ 
  area, 
  isOpen, 
  onClose, 
  onEditDetails,
  onEditShape,
  onDelete
}: AreaSidebarProps) {
  const { user } = useAuth();

  if (!area) return null;

  const isOwner = user && area.user_id === user.id;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 right-0 z-50 md:z-auto w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gold-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {area.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Description */}
            {area.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {area.description}
                </p>
              </div>
            )}

            {/* Visibility */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Visibility
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                area.visibility === 'public'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {area.visibility === 'public' ? 'Public' : 'Private'}
              </span>
            </div>

            {/* Category */}
            {area.category && area.category !== 'custom' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Category
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200">
                  {area.category.charAt(0).toUpperCase() + area.category.slice(1)}
                </span>
              </div>
            )}

            {/* Action Buttons - Only show if owner */}
            {isOwner && (onEditDetails || onEditShape || onDelete) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {onEditDetails && (
                  <button
                    onClick={() => {
                      onEditDetails(area);
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-900/20 border border-gold-300 dark:border-gold-700 rounded-lg hover:bg-gold-100 dark:hover:bg-gold-900/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Details
                  </button>
                )}
                
                {onEditShape && (
                  <button
                    onClick={() => {
                      onEditShape(area);
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-900/20 border border-gold-300 dark:border-gold-700 rounded-lg hover:bg-gold-100 dark:hover:bg-gold-900/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Change Shape
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${area.name}"? This action cannot be undone.`)) {
                        onDelete(area);
                        onClose();
                      }
                    }}
                    className="w-full px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Area
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

