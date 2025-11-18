'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import type { Ad } from '../types';

interface AdsPublicStackProps {
  placement: 'article_left' | 'article_right';
  articleSlug?: string | null;
  className?: string;
  maxAds?: number; // Maximum number of ads to show (default: 5)
  spacing?: number; // Spacing between ads in pixels (default: 16)
}

const DEFAULT_MAX_ADS = 5;
const DEFAULT_SPACING = 16;

export function AdsPublicStack({ 
  placement, 
  articleSlug, 
  className = '',
  maxAds = DEFAULT_MAX_ADS,
  spacing = DEFAULT_SPACING
}: AdsPublicStackProps) {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrackedImpression, setHasTrackedImpression] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadAds = async () => {
      try {
        const params = new URLSearchParams({
          placement,
          ...(articleSlug && { articleSlug }),
          limit: maxAds.toString(),
        });
        const response = await fetch(`/api/ads/public?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAds(data.ads || []);
        }
      } catch (error) {
        console.error('Error loading ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAds();
  }, [placement, articleSlug, maxAds]);

  // Track impressions when ads become visible
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // Track when 50% visible
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

    // Observe all ad elements
    ads.forEach((ad) => {
      const element = document.querySelector(`[data-ad-id="${ad.id}"]`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [ads, hasTrackedImpression]);

  const trackImpression = async (adId: string) => {
    try {
      const params = new URLSearchParams({
        type: 'impression',
        placement,
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
        placement,
        ...(articleSlug && { articleSlug }),
      });
      await fetch(`/api/ads/${adId}/track?${params}`, { method: 'POST' });
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white border-2 border-gray-200 rounded-xl p-8 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <div 
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: `${spacing}px` }}
    >
      {ads.map((ad) => (
        <div
          key={ad.id}
          data-ad-id={ad.id}
          className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Ad Image */}
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
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={ad.image_url}
                alt={ad.headline}
                className="w-full h-full object-cover"
              />
            </div>
          </a>

          {/* Ad Text */}
          <div className="p-4">
            <a
              href={ad.link_url}
              onClick={(e) => {
                e.preventDefault();
                trackClick(ad.id, ad.link_url);
              }}
              className="block hover:opacity-80 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3 className="text-sm font-bold text-black mb-1 line-clamp-2">
                {ad.headline}
              </h3>
              {ad.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {ad.description}
                </p>
              )}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

