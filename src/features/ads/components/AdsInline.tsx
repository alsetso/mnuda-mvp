'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth';
import type { Ad } from '../types';

interface AdsInlineProps {
  articleSlug?: string | null;
  className?: string;
  maxAds?: number; // Maximum number of ads to show (default: 2-3)
  insertAfterParagraph?: number; // Insert after Nth paragraph (default: 3)
}

const DEFAULT_MAX_ADS = 2;
const DEFAULT_INSERT_AFTER = 3;

export function AdsInline({ 
  articleSlug, 
  className = '',
  maxAds = DEFAULT_MAX_ADS,
  insertAfterParagraph = DEFAULT_INSERT_AFTER
}: AdsInlineProps) {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrackedImpression, setHasTrackedImpression] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAds = async () => {
      try {
        // For inline ads, we can use either placement or create a new placement type
        // Using article_both to get ads that can appear anywhere
        const params = new URLSearchParams({
          placement: 'article_both', // Or create 'article_inline' placement type
          ...(articleSlug && { articleSlug }),
          limit: maxAds.toString(),
        });
        const response = await fetch(`/api/ads/public?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAds(data.ads || []);
        }
      } catch (error) {
        console.error('Error loading inline ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAds();
  }, [articleSlug, maxAds]);

  // Track impressions when ads become visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const adId = entry.target.getAttribute('data-ad-id');
          if (adId && !hasTrackedImpression.has(adId)) {
            trackImpression(adId);
            setHasTrackedImpression(prev => new Set(prev).add(adId));
          }
        }
      });
    }, observerOptions);

    const adElements = containerRef.current.querySelectorAll('[data-ad-id]');
    adElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [ads, hasTrackedImpression]);

  const trackImpression = async (adId: string) => {
    try {
      const params = new URLSearchParams({
        type: 'impression',
        placement: 'article_both', // Or 'article_inline'
        ...(articleSlug && { articleSlug }),
      });
      await fetch(`/api/ads/${adId}/track?${params}`, { method: 'POST' });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async (adId: string, linkUrl: string) => {
    try {
      const params = new URLSearchParams({
        type: 'click',
        placement: 'article_both', // Or 'article_inline'
        ...(articleSlug && { articleSlug }),
      });
      await fetch(`/api/ads/${adId}/track?${params}`, { method: 'POST' });
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading || ads.length === 0) {
    return null; // Don't show loading state for inline ads
  }

  return (
    <div ref={containerRef} className={`my-8 ${className}`}>
      {ads.map((ad) => (
        <div
          key={ad.id}
          data-ad-id={ad.id}
          className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden my-6 hover:shadow-lg transition-shadow"
        >
          {/* Ad Content */}
          <a
            href={ad.link_url}
            onClick={(e) => {
              e.preventDefault();
              trackClick(ad.id, ad.link_url);
            }}
            className="block hover:opacity-90 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex flex-col sm:flex-row gap-4 p-4">
              {/* Ad Image */}
              <div className="flex-shrink-0 w-full sm:w-48 aspect-video sm:aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={ad.image_url}
                  alt={ad.headline}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Ad Text */}
              <div className="flex-1">
                <h3 className="text-base font-bold text-black mb-2">
                  {ad.headline}
                </h3>
                {ad.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {ad.description}
                  </p>
                )}
                <span className="inline-block mt-2 text-xs text-gold-600 font-semibold">
                  Learn More →
                </span>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}


