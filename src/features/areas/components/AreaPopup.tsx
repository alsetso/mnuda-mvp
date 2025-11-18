'use client';

import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Area } from '../services/areaService';

interface AreaPopupProps {
  area: Area;
  position: { x: number; y: number };
  onClose: () => void;
  onEditShape: (area: Area) => void;
  isOwner: boolean;
}

export function AreaPopup({ area, position, onClose, onEditShape, isOwner }: AreaPopupProps) {
  return (
    <div
      className="fixed z-50 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg p-3 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm mb-1 truncate">{area.name}</div>
          {area.description && (
            <div className="text-white/70 text-xs line-clamp-2">{area.description}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          title="Close"
        >
          <XMarkIcon className="w-4 h-4 text-white/60" />
        </button>
      </div>
      
      {isOwner && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <button
            onClick={() => {
              onEditShape(area);
              onClose();
            }}
            className="w-full px-3 py-2 bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/50 rounded text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
            title="Edit area shape"
          >
            <PencilIcon className="w-4 h-4" />
            Edit Shape
          </button>
        </div>
      )}
    </div>
  );
}

