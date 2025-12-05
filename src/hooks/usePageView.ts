'use client';

import { useEffect, useRef } from 'react';

type EntityType = 'post' | 'city' | 'county' | 'profile' | 'account' | 'business' | 'page' | 'feed' | 'map';

interface UsePageViewOptions {
  entity_type: EntityType;
  entity_id?: string;
  entity_slug?: string;
  enabled?: boolean;
}

/**
 * Hook to track page views
 * Tracks once per component mount to prevent duplicate tracking
 */
export function usePageView({ entity_type, entity_id, entity_slug, enabled = true }: UsePageViewOptions) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || hasTracked.current) return;
    if (!entity_id && !entity_slug) {
      console.warn('[usePageView] Skipping - no entity_id or entity_slug provided', { entity_type, entity_id, entity_slug });
      return;
    }

    hasTracked.current = true;

    // Track view asynchronously (don't block render)
    const payload = {
      entity_type,
      entity_id: entity_id || null,
      entity_slug: entity_slug || null,
    };
    
    console.log('[usePageView] Tracking page view:', payload);
    
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        console.log('[usePageView] Tracked successfully:', { 
          entity_type, 
          entity_id: entity_id || 'none',
          entity_slug: entity_slug || 'none',
          response: data 
        });
        return data;
      })
      .catch((error) => {
        // Silently fail - don't break the page
        console.error('[usePageView] Failed to track:', error.message || error, payload);
      });
  }, [entity_type, entity_id, entity_slug, enabled]);
}

