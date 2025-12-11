'use client';

import { useState, useEffect } from 'react';
import SimplePageLayout from '@/components/SimplePageLayout';
import { useAuth } from '@/features/auth';

// Force dynamic rendering - prevents static generation
export const dynamic = 'force-dynamic';

export default function MapPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isLoading: authLoading } = useAuth();
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    setIsMounted(true);
    // Dynamically construct import path to prevent Next.js static analysis
    const mapPath = './Map' + 'Content';
    import(mapPath).then((mod) => {
      setMapComponent(() => mod.default);
    }).catch((err) => {
      console.error('Failed to load map component:', err);
    });
  }, []);

  if (!isMounted || authLoading || !MapComponent) {
    return (
      <SimplePageLayout backgroundColor="bg-black" contentPadding="px-0 py-0" containerMaxWidth="full" hideFooter={true}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white font-medium">Loading...</div>
          </div>
        </div>
      </SimplePageLayout>
    );
  }

  return <MapComponent />;
}
