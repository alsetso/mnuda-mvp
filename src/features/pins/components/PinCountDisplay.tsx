'use client';

import { Pin } from '../services/pinService';
import { useAuth } from '@/features/auth';

interface PinCountDisplayProps {
  totalPins: number;
  visiblePins: number;
  currentZoom: number;
}

export function PinCountDisplay({ totalPins, visiblePins, currentZoom }: PinCountDisplayProps) {
  const { user } = useAuth();
  const MIN_ZOOM = 10;
  const isZoomedOut = currentZoom < MIN_ZOOM;

  if (totalPins === 0) {
    return null;
  }

  return (
    <div className="pointer-events-auto bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-white/20">
      <div className="flex items-center gap-2">
        <span className="text-lg">📍</span>
        <div className="flex flex-col">
          <div className="font-medium">
            {isZoomedOut ? (
              <span className="text-orange-300">
                {totalPins} pin{totalPins !== 1 ? 's' : ''} (zoom in to view)
              </span>
            ) : (
              <span>
                {visiblePins} of {totalPins} visible
              </span>
            )}
          </div>
          {isZoomedOut && (
            <div className="text-xs text-white/70 mt-0.5">
              Zoom to {MIN_ZOOM}x or higher
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






