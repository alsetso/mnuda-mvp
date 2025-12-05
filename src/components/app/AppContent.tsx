'use client';

import { useEffect, useState, ReactNode } from 'react';
import AppSidebar from './AppSidebar';

interface AppContentProps {
  activeSection?: 'map' | 'search' | 'list' | 'profile';
  children?: ReactNode;
  isSidebarOpen?: boolean;
  onSidebarClose?: () => void;
  isAgentPanelOpen?: boolean;
  isAuthenticated?: boolean;
}

export default function AppContent({ 
  activeSection = 'map', 
  children,
  isSidebarOpen = false,
  onSidebarClose,
  isAgentPanelOpen = false,
  isAuthenticated = false,
}: AppContentProps) {
  const headerHeight = '3.5rem'; // 56px

  const [isVisible, setIsVisible] = useState(false);
  const [prevSection, setPrevSection] = useState(activeSection);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setPrevSection(activeSection);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeSection]);

  return (
    <div
      className="fixed z-[90] bg-gold-100 animate-slide-up overflow-hidden transition-all duration-300 left-0 bottom-0"
      style={{
        top: headerHeight,
        right: isAgentPanelOpen ? '485px' : '0', // 480px panel + 5px gap
        width: isAgentPanelOpen ? 'calc(100% - 480px - 5px)' : '100%',
        borderTopLeftRadius: '1.5rem',
        borderTopRightRadius: '1.5rem',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Main Content Container with Sidebar Inside */}
      <div className="h-full w-full flex overflow-hidden relative">
        {/* Sidebar - Desktop: in flex layout, Mobile: absolute overlay (doesn't take flex space) */}
        {isAuthenticated && !isAgentPanelOpen && (
          <div 
            className="h-full overflow-hidden absolute md:relative md:flex-shrink-0 z-[200]" 
            style={{ borderTopLeftRadius: '1.5rem' }}
          >
            <AppSidebar 
              isOpen={isSidebarOpen} 
              onClose={onSidebarClose || (() => {})} 
            />
          </div>
        )}

        {/* Content Container - Expands to full width on mobile, flex-1 on desktop */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden w-full md:w-auto">
          <div
            key={activeSection}
            className={`h-full w-full transition-all duration-200 ${
              isVisible && prevSection === activeSection
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4'
            }`}
          >
            {children ? (
              children
            ) : (
              <div className="h-full w-full p-6">
                {activeSection === 'map' && (
                  <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🗺️</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Map View</h2>
                      <p className="text-gray-600">Interactive map content goes here</p>
                    </div>
                  </div>
                )}

                {activeSection === 'search' && (
                  <div className="h-full w-full bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Search</h2>
                      <p className="text-gray-600">Search functionality goes here</p>
                    </div>
                  </div>
                )}

                {activeSection === 'list' && (
                  <div className="h-full w-full bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">List View</h2>
                      <p className="text-gray-600">List of items goes here</p>
                    </div>
                  </div>
                )}

                {activeSection === 'profile' && (
                  <div className="h-full w-full bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👤</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile</h2>
                      <p className="text-gray-600">User profile content goes here</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

