'use client';

import React from 'react';

interface LocationToggleProps {
  isActive: boolean;
  isTracking: boolean;
  isFocusMode: boolean;
  onToggle: () => void;
  className?: string;
}

const LocationToggle: React.FC<LocationToggleProps> = ({ 
  isActive, 
  isTracking, 
  isFocusMode,
  onToggle, 
  className = '' 
}) => {
  return (
    <button
      onClick={onToggle}
      className={`
        relative w-12 h-12 rounded-full shadow-lg transition-all duration-200
        ${isFocusMode 
          ? 'bg-mnuda-dark-blue text-white hover:bg-opacity-90' 
          : isActive 
            ? 'bg-mnuda-light-blue text-white hover:bg-opacity-90' 
            : 'bg-white text-mnuda-dark-blue hover:bg-gray-50'
        }
        ${isTracking ? 'animate-pulse' : ''}
        ${isFocusMode ? 'ring-2 ring-mnuda-light-blue ring-opacity-50' : ''}
        ${className}
      `}
      title={isFocusMode ? 'Exit focus mode (unlock map)' : isActive ? 'Enter focus mode (lock to location)' : 'Show your location'}
    >
      {/* Location Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isTracking ? 'animate-bounce' : ''}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>

      {/* Focus Mode Indicator */}
      {isFocusMode && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-mnuda-light-blue rounded-full flex items-center justify-center">
          <svg 
            className="w-2 h-2 text-white"
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" 
              clipRule="evenodd" 
            />
            <path 
              fillRule="evenodd" 
              d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}

      {/* Directional Arrow (only when active and tracking, not in focus mode) */}
      {isActive && isTracking && !isFocusMode && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-mnuda-dark-blue rounded-full flex items-center justify-center">
          <svg 
            className="w-2 h-2 text-white"
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" 
              clipRule="evenodd" 
            />
            <path 
              fillRule="evenodd" 
              d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}

      {/* Tracking Indicator Ring */}
      {isTracking && (
        <div className="absolute inset-0 rounded-full border-2 border-mnuda-light-blue animate-ping opacity-75"></div>
      )}
    </button>
  );
};

export default LocationToggle;
