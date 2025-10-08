'use client';

import { useState, useEffect, useRef } from 'react';

export type ApiStatus = 'online' | 'offline' | 'checking';

interface ApiStatusState {
  status: ApiStatus;
  lastChecked: Date | null;
  error: string | null;
}

// Global singleton to manage API status across all components
class ApiStatusManager {
  private static instance: ApiStatusManager;
  private state: ApiStatusState = {
    status: 'checking',
    lastChecked: null,
    error: null,
  };
  private subscribers: Set<(state: ApiStatusState) => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private isChecking = false;
  private lastCheckTime = 0;
  private readonly CHECK_INTERVAL = 60000; // 60 seconds
  private readonly DEBOUNCE_TIME = 1000; // 1 second debounce

  static getInstance(): ApiStatusManager {
    if (!ApiStatusManager.instance) {
      ApiStatusManager.instance = new ApiStatusManager();
    }
    return ApiStatusManager.instance;
  }

  subscribe(callback: (state: ApiStatusState) => void): () => void {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.state);
    
    // Start the interval if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.startPeriodicChecks();
    }

    return () => {
      this.subscribers.delete(callback);
      // Stop the interval if no more subscribers
      if (this.subscribers.size === 0) {
        this.stopPeriodicChecks();
      }
    };
  }

  private startPeriodicChecks(): void {
    if (this.intervalId) return;
    
    // Initial check
    this.checkApiStatus();
    
    // Set up periodic checks every 60 seconds
    this.intervalId = setInterval(() => {
      this.checkApiStatus();
    }, this.CHECK_INTERVAL);
  }

  private stopPeriodicChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkApiStatus(): Promise<void> {
    // Debounce: prevent multiple simultaneous calls
    const now = Date.now();
    if (this.isChecking || (now - this.lastCheckTime) < this.DEBOUNCE_TIME) {
      return;
    }

    this.isChecking = true;
    this.lastCheckTime = now;
    
    this.updateState({ ...this.state, status: 'checking' });
    
    try {
      // Check the address API with test data
      const response = await fetch('/api/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          street: '3828 Double Oak Ln',
          citystatezip: 'Irving, TX 75061'
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        // If 200 but no records, consider it offline
        if (data && (data.records === 0 || (Array.isArray(data) && data.length === 0))) {
          this.updateState({
            status: 'offline',
            lastChecked: new Date(),
            error: 'No records returned',
          });
        } else {
          this.updateState({
            status: 'online',
            lastChecked: new Date(),
            error: null,
          });
        }
      } else {
        this.updateState({
          status: 'offline',
          lastChecked: new Date(),
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      this.updateState({
        status: 'offline',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.isChecking = false;
    }
  }

  private updateState(newState: ApiStatusState): void {
    this.state = newState;
    this.subscribers.forEach(callback => callback(newState));
  }

  // Manual check method for status page
  async manualCheck(): Promise<void> {
    await this.checkApiStatus();
  }
}

export function useApiStatus() {
  const [state, setState] = useState<ApiStatusState>({
    status: 'checking',
    lastChecked: null,
    error: null,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const manager = ApiStatusManager.getInstance();
    unsubscribeRef.current = manager.subscribe(setState);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const checkStatus = async () => {
    const manager = ApiStatusManager.getInstance();
    await manager.manualCheck();
  };

  return {
    status: state.status,
    lastChecked: state.lastChecked,
    error: state.error,
    checkStatus,
  };
}
