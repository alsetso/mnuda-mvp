'use client';

import React from 'react';

interface LocationPinProps {
  isActive: boolean;
  isTracking: boolean;
  onClick: () => void;
  className?: string;
}

const LocationPin: React.FC<LocationPinProps> = ({ 
  isActive, 
  isTracking, 
  onClick, 
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-mnuda-light-blue text-white hover:bg-opacity-90' 
          : 'text-mnuda-dark-blue hover:bg-gray-100'
        }
        ${className}
      `}
      title={isActive ? 'Hide your location' : 'Show your location'}
    >
      {/* Location Pin Icon */}
      <div className="relative">
        <svg 
          className="w-5 h-5"
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" 
            clipRule="evenodd" 
          />
        </svg>
        
        {/* Tracking Indicator Dot - static, no animation */}
        {isTracking && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-mnuda-dark-blue rounded-full"></div>
        )}
      </div>
    </button>
  );
};

export default LocationPin;
