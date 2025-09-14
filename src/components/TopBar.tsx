'use client';

import React from 'react';
import Link from 'next/link';
import MnudaLogo from './MnudaLogo';
import LocationToggle from './LocationToggle';
import MapSearch from './MapSearch';

import { Pin } from '@/types/pin';

interface TopBarProps {
  user?: any;
  onLogout?: () => void;
  showUserLocation?: boolean;
  isTrackingLocation?: boolean;
  onLocationToggle?: () => void;
  onLocationSelect?: (suggestion: any) => void;
  onFlyToLocation?: (coordinates: [number, number], address: string) => void;
  pins?: Pin[];
}

const TopBar: React.FC<TopBarProps> = ({ user, onLogout, showUserLocation, isTrackingLocation, onLocationToggle, onLocationSelect, onFlyToLocation, pins = [] }) => {
  return (
    <nav className="fixed top-4 left-4 right-4 max-w-[600px] mx-auto bg-white/95 backdrop-blur-sm shadow-md border border-gray-200 rounded-lg px-4 py-3 z-50">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <MnudaLogo size="sm" />
        </Link>

        {/* Map Search */}
        <MapSearch 
          onLocationSelect={onLocationSelect} 
          onFlyToLocation={onFlyToLocation}
          isFocusMode={showUserLocation || false}
          pins={pins}
        />

        {/* Right side controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Location Toggle */}
          {onLocationToggle && (
            <LocationToggle
              isActive={showUserLocation || false}
              isTracking={isTrackingLocation || false}
              isFocusMode={showUserLocation || false}
              onToggle={onLocationToggle}
            />
          )}

          {/* Login/Profile Avatar */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mnuda-light-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-gray-700 hover:text-mnuda-dark-blue transition-colors font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
