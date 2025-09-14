'use client';

import React, { useState } from 'react';
import TopBar from './TopBar';
import { Pin } from '@/types/pin';

interface AppLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
  showUserLocation?: boolean;
  isTrackingLocation?: boolean;
  onLocationToggle?: () => void;
  pins?: Pin[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  showUserLocation, 
  isTrackingLocation, 
  onLocationToggle,
  pins = []
}) => {
  return (
    <div className="relative w-full h-screen">
      {/* Absolute TopBar over the map */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <TopBar 
          user={user} 
          onLogout={onLogout}
          showUserLocation={showUserLocation}
          isTrackingLocation={isTrackingLocation}
          onLocationToggle={onLocationToggle}
          pins={pins}
        />
      </div>
      
      {/* Main Content - full height */}
      <main className="w-full h-full">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
