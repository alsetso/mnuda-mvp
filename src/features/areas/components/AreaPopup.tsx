'use client';

import { Area } from '../services/areaService';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AreaPopupProps {
  area: Area;
  position: { x: number; y: number };
  onClose: () => void;
  onEditShape: (area: Area) => void;
  isOwner: boolean;
}

export function AreaPopup({
  area,
  position,
  onClose,
  onEditShape,
  isOwner,
}: AreaPopupProps) {
  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 min-w-[200px] max-w-[300px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-black text-black text-sm mb-1">{area.name}</h3>
          {area.description && (
            <p className="text-xs text-gray-600 mb-2">{area.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="capitalize">{area.category || 'custom'}</span>
            <span>•</span>
            <span className="capitalize">{area.visibility}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {isOwner && (
        <button
          onClick={() => onEditShape(area)}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PencilIcon className="w-4 h-4" />
          Edit Shape
        </button>
      )}
    </div>
  );
}
