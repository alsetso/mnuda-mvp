'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ListBulletIcon, ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  selectedAreaId?: string | null;
  onDeleteArea?: () => void;
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
  allowCreate = true,
  selectedAreaId,
  onDeleteArea
}: GlobalFloatingMenuProps) {
  const [internalActiveAction, setInternalActiveAction] = useState<'create' | 'search' | 'list' | 'draw' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { warning } = useToast();
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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

  // Responsive positioning and sizing
  const containerClasses = isMobile
    ? 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm'
    : 'fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md';

  return (
    <div className={`${containerClasses} z-[3000] pointer-events-none transition-all duration-300`}>
      {/* Container with enhanced background and border */}
      <div className="pointer-events-auto bg-black/30 backdrop-blur-md rounded-3xl border border-white/30 overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/40">
        {/* Dynamic Content Area - Above menu with improved styling */}
        {showContent && children && (
          <div 
            className={`
              px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4
              animate-in fade-in slide-in-from-bottom-2 duration-300
              flex flex-col
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              ${isMobile ? 'max-h-[calc(100vh-12rem)]' : 'max-h-[32rem]'}
              overflow-y-auto
              border-b border-white/20
            `}
          >
            {children}
          </div>
        )}

        {/* Floating Menu Bar - Enhanced with better spacing and touch targets */}
        <div className={`
          flex items-center justify-center
          ${isMobile ? 'gap-1.5 p-2' : 'gap-2 p-2.5'}
          flex-wrap
        `}>
          {allowCreate && (
            <button
              onClick={() => handleMenuClick('create')}
              disabled={isZoomTooLow && activeAction !== 'create'}
              className={`
                relative
                ${isMobile ? 'w-12 h-12' : 'w-11 h-11'}
                flex items-center justify-center
                rounded-xl
                transition-all duration-200
                text-gray-200
                hover:text-white
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50
                ${
                  activeAction === 'create'
                    ? 'bg-white/25 text-white shadow-lg shadow-white/10'
                    : 'bg-white/10 hover:bg-white/15'
                }
                ${
                  isZoomTooLow && activeAction !== 'create'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }
              `}
              title={isZoomTooLow ? `Zoom in to ${minZoomForCreate}x to create pin (current: ${currentZoom.toFixed(1)}x)` : 'Create Pin'}
              aria-label="Create Pin"
            >
              <PlusIcon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
              {isZoomTooLow && activeAction !== 'create' && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border border-white/30 shadow-sm"></span>
              )}
            </button>
          )}
          
          <button
            onClick={() => handleMenuClick('search')}
            className={`
              ${isMobile ? 'w-12 h-12' : 'w-11 h-11'}
              flex items-center justify-center
              rounded-xl
              transition-all duration-200
              text-gray-200
              hover:text-white
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50
              ${
                activeAction === 'search'
                  ? 'bg-white/25 text-white shadow-lg shadow-white/10'
                  : 'bg-white/10 hover:bg-white/15'
              }
              cursor-pointer
            `}
            title="Search"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
          </button>
          
          <button
            onClick={() => handleMenuClick('list')}
            className={`
              ${isMobile ? 'w-12 h-12' : 'w-11 h-11'}
              flex items-center justify-center
              rounded-xl
              transition-all duration-200
              text-gray-200
              hover:text-white
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50
              ${
                activeAction === 'list'
                  ? 'bg-white/25 text-white shadow-lg shadow-white/10'
                  : 'bg-white/10 hover:bg-white/15'
              }
              cursor-pointer
            `}
            title="List"
            aria-label="List"
          >
            <ListBulletIcon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
          </button>
          
          <button
            onClick={() => handleMenuClick('draw')}
            className={`
              ${isMobile ? 'w-12 h-12' : 'w-11 h-11'}
              flex items-center justify-center
              rounded-xl
              transition-all duration-200
              text-gray-200
              hover:text-white
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50
              ${
                activeAction === 'draw'
                  ? 'bg-white/25 text-white shadow-lg shadow-white/10'
                  : 'bg-white/10 hover:bg-white/15'
              }
              cursor-pointer
            `}
            title="Draw Polygon"
            aria-label="Draw Polygon"
          >
            <PencilIcon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
          </button>

          {/* Delete Area Button - Show when in draw mode and area is selected */}
          {activeAction === 'draw' && selectedAreaId && onDeleteArea && (
            <button
              onClick={onDeleteArea}
              className={`
                ${isMobile ? 'w-12 h-12' : 'w-11 h-11'}
                flex items-center justify-center
                rounded-xl
                transition-all duration-200
                text-red-400
                hover:text-red-300
                hover:bg-red-500/25
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-black/50
                bg-red-500/15
                cursor-pointer
                shadow-sm
              `}
              title="Delete Selected Area"
              aria-label="Delete Selected Area"
            >
              <TrashIcon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
            </button>
          )}
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`
                ${isMobile ? 'w-12 h-12' : 'w-11 h-11'}
                flex items-center justify-center
                rounded-xl
                transition-all duration-200
                text-gray-200
                hover:text-white
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50
                bg-white/10
                hover:bg-white/15
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/10
                cursor-pointer
              `}
              title="Refresh"
              aria-label="Refresh"
            >
              <ArrowPathIcon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
