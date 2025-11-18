'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth';
import type { Ad } from '../types';

interface AdsPublicCarouselProps {
  placement: 'article_left' | 'article_right';
  articleSlug?: string | null;
  className?: string;
  maxAds?: number; // Maximum number of ads to show (default: 5)
  rotationInterval?: number; // Auto-rotate interval in milliseconds (default: 8000 = 8 seconds)
}

const DEFAULT_MAX_ADS = 5;
const DEFAULT_ROTATION_INTERVAL = 8000; // 8 seconds

export function AdsPublicCarousel({ 
  placement, 
  articleSlug, 
  className = '',
  maxAds = DEFAULT_MAX_ADS,
  rotationInterval = DEFAULT_ROTATION_INTERVAL
}: AdsPublicCarouselProps) {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrackedImpression, setHasTrackedImpression] = useState<Set<string>>(new Set());
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          const loadedAds = data.ads || [];
          setAds(loadedAds);
          // Reset index if we have fewer ads than before
          if (loadedAds.length > 0 && currentIndex >= loadedAds.length) {
            setCurrentIndex(0);
          }
        }
      } catch (error) {
        console.error('Error loading ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAds();
  }, [placement, articleSlug, maxAds]);

  // Auto-rotate ads
  useEffect(() => {
    if (ads.length <= 1) return; // Don't rotate if only one ad

    // Clear existing timer
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }

    // Set up auto-rotation
    rotationTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, rotationInterval);

    // Cleanup on unmount or when ads change
    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [ads.length, rotationInterval]);

  // Track impression when ad becomes visible
  useEffect(() => {
    if (ads.length > 0 && currentIndex < ads.length) {
      const ad = ads[currentIndex];
      if (ad && !hasTrackedImpression.has(ad.id)) {
        trackImpression(ad.id);
        setHasTrackedImpression(prev => new Set(prev).add(ad.id));
      }
    }
  }, [currentIndex, ads, hasTrackedImpression]);

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

  const nextAd = () => {
    // Clear auto-rotation timer when user manually navigates
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    // Restart auto-rotation after manual navigation
    rotationTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, rotationInterval);
  };

  const prevAd = () => {
    // Clear auto-rotation timer when user manually navigates
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    // Restart auto-rotation after manual navigation
    rotationTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, rotationInterval);
  };

  const goToAd = (index: number) => {
    // Clear auto-rotation timer when user manually navigates
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    setCurrentIndex(index);
    // Restart auto-rotation after manual navigation
    rotationTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, rotationInterval);
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

  const currentAd = ads[currentIndex];

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Ad Content */}
      <div className="relative">
        <a
          href={currentAd.link_url}
          onClick={(e) => {
            e.preventDefault();
            trackClick(currentAd.id, currentAd.link_url);
          }}
          className="block hover:opacity-90 transition-opacity"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="aspect-video bg-gray-100 relative">
            <img
              src={currentAd.image_url}
              alt={currentAd.headline}
              className="w-full h-full object-cover"
            />
          </div>
        </a>

        {/* Navigation */}
        {ads.length > 1 && (
          <>
            <button
              onClick={prevAd}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous ad"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={nextAd}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next ad"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        {ads.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => goToAd(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ad Text */}
      <div className="p-4">
        <a
          href={currentAd.link_url}
          onClick={(e) => {
            e.preventDefault();
            trackClick(currentAd.id, currentAd.link_url);
          }}
          className="block hover:opacity-80 transition-opacity"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3 className="text-sm font-bold text-black mb-1 line-clamp-2">
            {currentAd.headline}
          </h3>
          {currentAd.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {currentAd.description}
            </p>
          )}
        </a>
      </div>
    </div>
  );
}

