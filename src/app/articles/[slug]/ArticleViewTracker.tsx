'use client';

import { useEffect, useRef } from 'react';

interface ArticleViewTrackerProps {
  slug: string;
}

export function ArticleViewTracker({ slug }: ArticleViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    
    // Track view after a short delay to ensure page is fully loaded
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/articles/${slug}/view`, {
          method: 'POST',
          credentials: 'include',
        });
        hasTracked.current = true;
      } catch (error) {
        console.error('Error tracking article view:', error);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}

