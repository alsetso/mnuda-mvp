'use client';

import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

type ViewMode = 'card' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center gap-1 bg-gray-100 rounded-md p-0.5 ${className}`}>
      <button
        onClick={() => onViewChange('card')}
        className={`
          p-1 rounded-md transition-colors
          ${view === 'card'
            ? 'bg-white text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
        aria-label="Card view"
        title="Card view"
      >
        <Squares2X2Icon className="w-3 h-3" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`
          p-1 rounded-md transition-colors
          ${view === 'list'
            ? 'bg-white text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
        aria-label="List view"
        title="List view"
      >
        <ListBulletIcon className="w-3 h-3" />
      </button>
    </div>
  );
}







