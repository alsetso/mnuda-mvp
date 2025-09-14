'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { locationService } from '@/lib/locationService';
import AppLayout from '@/components/AppLayout';
import MapBox from '@/components/MapBox';
import { Pin } from '@/types/pin';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
    
    // Return empty cleanup function if supabase is not available
    return () => {};
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handlePinDrop = useCallback((lng: number, lat: number) => {
    if (user) {
      // Here you would typically save the pin data to your database
      console.log('Pin dropped at:', { lng, lat });
      alert(`Pin dropped at coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } else {
      alert('Please log in to drop pins');
    }
  }, [user]);

  const handleLocationToggle = useCallback(() => {
    const permission = locationService.getPermissionStatus();
    
    if (permission === 'granted') {
      // Toggle location visibility
      setShowUserLocation(!showUserLocation);
      setIsTrackingLocation(!showUserLocation);
    } else {
      // Permission not granted, the MapBox component will show the modal
      // We just need to trigger the toggle
      setShowUserLocation(!showUserLocation);
    }
  }, [showUserLocation]);

  const handlePinsChange = useCallback((newPins: Pin[]) => {
    setPins(newPins);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mnuda-light-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MNUDA...</p>
          <p className="text-sm text-gray-500 mt-2">Minnesota Realtors Platform</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      user={user} 
      onLogout={handleLogout}
      showUserLocation={showUserLocation}
      isTrackingLocation={isTrackingLocation}
      onLocationToggle={handleLocationToggle}
      pins={pins}
    >
      <MapBox 
        onPinDrop={handlePinDrop}
        showUserLocation={showUserLocation}
        onLocationToggle={handleLocationToggle}
        onPinsChange={handlePinsChange}
      />
    </AppLayout>
  );
}
