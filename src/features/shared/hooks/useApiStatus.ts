'use client';

import { useState, useEffect } from 'react';

export type ApiStatus = 'online' | 'offline' | 'checking';

interface ApiStatusState {
  status: ApiStatus;
  lastChecked: Date | null;
  error: string | null;
}

export function useApiStatus() {
  const [state, setState] = useState<ApiStatusState>({
    status: 'checking',
    lastChecked: null,
    error: null,
  });

  const checkApiStatus = async () => {
    setState(prev => ({ ...prev, status: 'checking' }));
    
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
          setState({
            status: 'offline',
            lastChecked: new Date(),
            error: 'No records returned',
          });
        } else {
          setState({
            status: 'online',
            lastChecked: new Date(),
            error: null,
          });
        }
      } else {
        setState({
          status: 'offline',
          lastChecked: new Date(),
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      setState({
        status: 'offline',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkApiStatus();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    status: state.status,
    lastChecked: state.lastChecked,
    error: state.error,
    checkStatus: checkApiStatus,
  };
}
