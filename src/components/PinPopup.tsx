'use client';

import React from 'react';
import { Pin } from '@/types/pin';

interface PinPopupProps {
  pin: Pin;
  isVisible: boolean;
  position: { x: number; y: number };
}

const PinPopup: React.FC<PinPopupProps> = ({ pin, isVisible, position }) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      {/* Arrow pointing to pin */}
      <div className="absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
      <div className="absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200" style={{ transform: 'translateY(1px)' }}></div>
      
      {/* Content */}
      <div className="space-y-1">
        <h3 className="font-semibold text-mnuda-dark-blue text-sm truncate">
          {pin.name}
        </h3>
        <p className="text-xs text-gray-600 leading-tight">
          {pin.full_address}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(pin.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PinPopup;
