'use client';

import { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ListBulletIcon, ArrowPathIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';

interface GlobalFloatingMenuProps {
  children?: React.ReactNode;
  activeAction?: 'create' | 'search' | 'list' | 'draw' | null;
  onMenuAction?: (action: 'create' | 'search' | 'list' | 'draw' | null) => void;
  currentZoom?: number;
  minZoomForCreate?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  allowCreate?: boolean;
}

const DEFAULT_MIN_ZOOM = 12;

export function GlobalFloatingMenu({ 
  children, 
  activeAction: controlledActiveAction,
  onMenuAction,
  currentZoom = 0,
  minZoomForCreate = DEFAULT_MIN_ZOOM,
  onRefresh,
  isRefreshing = false,
  allowCreate = true
}: GlobalFloatingMenuProps) {
  const [internalActiveAction, setInternalActiveAction] = useState<'create' | 'search' | 'list' | 'draw' | null>(null);
  const { warning } = useToast();
  
  // Use controlled or internal state
  const activeAction = controlledActiveAction !== undefined ? controlledActiveAction : internalActiveAction;
  const showContent = activeAction !== null;

  const handleMenuClick = (action: 'create' | 'search' | 'list' | 'draw') => {
    // Disable create action if not allowed
    if (action === 'create' && !allowCreate) {
      return;
    }

    // Check zoom level for create action
    if (action === 'create' && currentZoom < minZoomForCreate) {
      warning(
        'Zoom In Required',
        `Please zoom in to at least ${minZoomForCreate}x to create a pin. Current zoom: ${currentZoom.toFixed(1)}x`
      );
      return;
    }

    if (activeAction === action) {
      // Toggle off if clicking the same action
      const newAction = null;
      if (controlledActiveAction === undefined) {
        setInternalActiveAction(newAction);
      }
      onMenuAction?.(newAction);
    } else {
      if (controlledActiveAction === undefined) {
        setInternalActiveAction(action);
      }
      onMenuAction?.(action);
    }
  };

  // Show zoom warning indicator on create button if zoom is too low
  const isZoomTooLow = currentZoom < minZoomForCreate;
  const createButtonDisabled = (activeAction === 'create' && isZoomTooLow) || !allowCreate;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {/* Container with background and border */}
      <div className="pointer-events-auto bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        {/* Dynamic Content Area - Above menu */}
        {showContent && children && (
          <div className="px-4 pt-4 pb-3 animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[30rem] overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {children}
          </div>
        )}

        {/* Floating Menu Bar */}
        <div className="flex items-center gap-1 p-1.5">
          {allowCreate && (
            <button
              onClick={() => handleMenuClick('create')}
              disabled={isZoomTooLow && activeAction !== 'create'}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-300 ${
                activeAction === 'create'
                  ? 'bg-white/20'
                  : 'bg-transparent'
              } ${
                isZoomTooLow && activeAction !== 'create'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              title={isZoomTooLow ? `Zoom in to ${minZoomForCreate}x to create pin (current: ${currentZoom.toFixed(1)}x)` : 'Create Pin'}
            >
              <PlusIcon className="w-5 h-5" />
              {isZoomTooLow && activeAction !== 'create' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>
          )}
          
          <button
            onClick={() => handleMenuClick('search')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-300 ${
              activeAction === 'search'
                ? 'bg-white/20'
                : 'bg-transparent'
            }`}
            title="Search"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleMenuClick('list')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-300 ${
              activeAction === 'list'
                ? 'bg-white/20'
                : 'bg-transparent'
            }`}
            title="List"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleMenuClick('draw')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all text-gray-300 ${
              activeAction === 'draw'
                ? 'bg-white/20'
                : 'bg-transparent'
            }`}
            title="Draw Polygon"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all bg-transparent text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

