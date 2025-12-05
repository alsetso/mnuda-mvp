'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to track navigation type (initial load vs client-side navigation)
 * Uses sessionStorage to persist across page loads
 */
export function useNavigationTracking() {
  const pathname = usePathname();
  const isInitialMount = useRef(true);
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    // On first mount, check if this is a hard reload
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Check if navigation type is already set (from previous page)
      const navType = sessionStorage.getItem('navigationType');
      
      // If not set, this is an initial load (hard reload or direct navigation)
      if (!navType) {
        sessionStorage.setItem('navigationType', 'initial');
      }
      
      previousPathname.current = pathname;
      return;
    }

    // Pathname changed - this is a client-side navigation
    if (previousPathname.current !== pathname) {
      sessionStorage.setItem('navigationType', 'client');
      previousPathname.current = pathname;
    }
  }, [pathname]);

  // Clean up on page unload (hard reload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('navigationType');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}



