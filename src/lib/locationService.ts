export interface LocationPermission {
  status: 'granted' | 'denied' | 'prompt';
  timestamp: number;
  expiresAt: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class LocationService {
  private readonly STORAGE_KEY = 'mnuda_location_permission';
  private readonly EXPIRY_HOURS = 24;
  private watchId: number | null = null;
  private currentPosition: LocationData | null = null;

  /**
   * Check if we should show the location permission modal
   * Returns true if:
   * - No permission stored
   * - Permission expired (24+ hours old)
   * - Permission was denied and 24+ hours have passed
   */
  shouldShowLocationModal(): boolean {
    const permission = this.getStoredPermission();
    
    if (!permission) {
      return true; // No permission stored, show modal
    }

    const now = Date.now();
    const isExpired = now >= permission.expiresAt;
    
    if (isExpired) {
      // Permission expired, show modal again
      return true;
    }

    // Permission is still valid, don't show modal
    return false;
  }

  /**
   * Get the current permission status
   */
  getPermissionStatus(): 'granted' | 'denied' | 'prompt' {
    const permission = this.getStoredPermission();
    if (!permission) return 'prompt';
    
    const now = Date.now();
    if (now >= permission.expiresAt) return 'prompt';
    
    return permission.status;
  }

  /**
   * Store permission response with 24-hour expiry
   */
  setPermissionResponse(status: 'granted' | 'denied'): void {
    const now = Date.now();
    const expiresAt = now + (this.EXPIRY_HOURS * 60 * 60 * 1000); // 24 hours from now
    
    const permission: LocationPermission = {
      status,
      timestamp: now,
      expiresAt
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(permission));
  }

  /**
   * Get stored permission from localStorage
   */
  private getStoredPermission(): LocationPermission | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored) as LocationPermission;
    } catch (error) {
      console.error('Error reading location permission from storage:', error);
      return null;
    }
  }

  /**
   * Request current location (only if permission granted)
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    const permission = this.getPermissionStatus();
    
    if (permission !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          this.currentPosition = locationData;
          resolve(locationData);
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Start watching user location (only if permission granted)
   */
  startWatchingLocation(onLocationUpdate: (location: LocationData) => void): boolean {
    const permission = this.getPermissionStatus();
    
    if (permission !== 'granted') {
      console.log('Location permission not granted, cannot start watching');
      return false;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }

    // Stop any existing watch first
    this.stopWatchingLocation();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        this.currentPosition = locationData;
        onLocationUpdate(locationData);
      },
      (error) => {
        console.error('Error watching location:', error);
        
        // Handle specific error codes
        switch (error.code) {
          case error.TIMEOUT:
            console.log('Location request timed out, retrying...');
            // Retry with less strict options
            this.retryWithFallbackOptions(onLocationUpdate);
            break;
          case error.PERMISSION_DENIED:
            console.log('Location permission denied');
            this.setPermissionResponse('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            console.log('Location unavailable');
            break;
        }
      },
      {
        enableHighAccuracy: false, // Start with less accurate but faster
        timeout: 15000, // Increased timeout
        maximumAge: 60000 // 1 minute cache
      }
    );

    return true;
  }

  /**
   * Retry with fallback options if initial request fails
   */
  private retryWithFallbackOptions(onLocationUpdate: (location: LocationData) => void): void {
    if (this.watchId !== null) return; // Already retrying

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        this.currentPosition = locationData;
        onLocationUpdate(locationData);
      },
      (error) => {
        console.error('Fallback location request failed:', error);
        this.stopWatchingLocation();
      },
      {
        enableHighAccuracy: false,
        timeout: 30000, // Longer timeout for fallback
        maximumAge: 300000 // 5 minutes cache
      }
    );
  }

  /**
   * Stop watching user location
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get the last known position
   */
  getLastKnownPosition(): LocationData | null {
    return this.currentPosition;
  }

  /**
   * Clear stored permission (for testing or reset)
   */
  clearPermission(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.stopWatchingLocation();
    this.currentPosition = null;
  }

  /**
   * Get time until permission expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    const permission = this.getStoredPermission();
    if (!permission) return 0;
    
    const now = Date.now();
    return Math.max(0, permission.expiresAt - now);
  }

  /**
   * Get formatted time until expiry (for debugging)
   */
  getFormattedTimeUntilExpiry(): string {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    if (timeUntilExpiry === 0) return 'Expired';
    
    const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}

// Export singleton instance
export const locationService = new LocationService();
