// useUserLocationTracker.ts
// Robust hook for managing continuous or one-time user location tracking

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UseUserLocationTrackerReturn, Coordinates } from '../types';
import { MAP_CONFIG } from '../config';

interface TrackerOptions {
  pollIntervalMs?: number; // fallback polling if watchPosition unsupported
  historyLimit?: number;   // max history points
}

type TrackerStatus = 'idle' | 'tracking' | 'error';

interface LocationHistoryEntry {
  t: number;   // timestamp
  lat: number;
  lng: number;
}

export function useUserLocationTracker(
  options: TrackerOptions = {}
): UseUserLocationTrackerReturn & {
  status: TrackerStatus;
  lastUpdated: number | null;
  refreshCount: number;
} {
  const { pollIntervalMs = 0, historyLimit = 100 } = options;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [locationHistory, setLocationHistory] = useState<LocationHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // Internal refs
  // ---------------------------------------------------------------------------
  const watchId = useRef<number | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const pushToHistory = useCallback(
    (latitude: number, longitude: number) => {
      setLocationHistory((prev) => {
        const newEntry: LocationHistoryEntry = { t: Date.now(), lat: latitude, lng: longitude };
        return [...prev.slice(-(historyLimit - 1)), newEntry];
      });
    },
    [historyLimit]
  );

  const updateLocation = useCallback(
    (latitude: number, longitude: number) => {
      setUserLocation({ latitude, longitude });
      pushToHistory(latitude, longitude);
      setLastUpdated(Date.now());
      setRefreshCount((c) => c + 1);
    },
    [pushToHistory]
  );

  // ---------------------------------------------------------------------------
  // One-time fetch
  // ---------------------------------------------------------------------------
  const getCurrentLocation = useCallback(
    (): Promise<Coordinates | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            resolve({ latitude, longitude });
          },
          (err) => {
            console.error('Error getting current location:', err);
            setError(err.message);
            setStatus('error');
            resolve(null);
          },
          MAP_CONFIG.GEOLOCATION_OPTIONS
        );
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Stop tracking
  // ---------------------------------------------------------------------------
  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    setStatus('idle');
  }, []);

  // ---------------------------------------------------------------------------
  // Start tracking
  // ---------------------------------------------------------------------------
  const startTracking = useCallback(() => {
    if (status === 'tracking') return; // already tracking
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      setStatus('error');
      return;
    }

    setStatus('tracking');
    setError(null);

    try {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updateLocation(latitude, longitude);
        },
        (err) => {
          console.error('Error watching position:', err);
          setError(err.message);
          setStatus('error');
          stopTracking();
        },
        MAP_CONFIG.GEOLOCATION_OPTIONS
      );
    } catch (err: unknown) {
      console.warn('watchPosition failed, falling back to polling.', err);
    }

    if (pollIntervalMs > 0) {
      pollTimer.current = setInterval(async () => {
        const loc = await getCurrentLocation();
        if (loc) updateLocation(loc.latitude, loc.longitude);
      }, pollIntervalMs);
    }
  }, [status, pollIntervalMs, updateLocation, getCurrentLocation, stopTracking]);

  // ---------------------------------------------------------------------------
  // Clear history
  // ---------------------------------------------------------------------------
  const clearHistory = useCallback(() => {
    setLocationHistory([]);
    setRefreshCount(0);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    userLocation,
    isTracking: status === 'tracking',
    locationHistory,
    watchId: watchId.current,
    error,
    startTracking,
    stopTracking,
    clearHistory,
    getCurrentLocation,
    status,
    lastUpdated,
    refreshCount,
  };
}
