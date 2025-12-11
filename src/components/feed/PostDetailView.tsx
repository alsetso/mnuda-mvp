'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { FeedPostData } from './FeedPost';
import { filterValidMedia, isVideo } from './utils/feedHelpers';
import PostMapRenderer from './PostMapRenderer';

interface PostDetailViewProps {
  post: FeedPostData;
  mapData?: {
    type: 'pin' | 'area' | 'both';
    geometry: GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon;
    center?: [number, number];
    screenshot?: string;
    hidePin?: boolean;
    polygon?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  } | null;
  onMapClick?: () => void;
}

// Simple video player
function VideoPlayer({ 
  src, 
  title, 
  alt,
  poster
}: { 
  src: string; 
  title?: string; 
  alt?: string;
  poster?: string;
}) {
  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
      aria-label={title || alt}
    />
  );
}

export default function PostDetailView({ post, mapData, onMapClick }: PostDetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const account = useMemo(() => post.accounts, [post.accounts]);
  
  const displayName = useMemo(() => {
    if (account?.first_name || account?.last_name) {
      return `${account.first_name || ''} ${account.last_name || ''}`.trim();
    }
    return 'User';
  }, [account?.first_name, account?.last_name]);

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'recently';
    }
  }, [post.created_at]);

  const validMedia = useMemo(() => filterValidMedia(post.images), [post.images]);
  const hasMedia = validMedia.length > 0;
  const showMapInFirstColumn = !hasMedia && mapData;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % validMedia.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + validMedia.length) % validMedia.length);
  };

  return (
    <article className="space-y-4" aria-label={`Post by ${displayName}: ${post.title}`}>
      {/* Title - Above Content */}
      {post.title && (
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          {post.title}
        </h1>
      )}

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Horizontal Photo Carousel - Zillow Style */}
      {validMedia.length > 0 && (
        <div className="w-full">
          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {validMedia[currentImageIndex] && (
              isVideo(validMedia[currentImageIndex]) ? (
                <VideoPlayer
                  src={validMedia[currentImageIndex].url}
                  title={post.title || undefined}
                  alt={`Video ${currentImageIndex + 1} for ${post.title || 'post'}`}
                  poster={validMedia[currentImageIndex].thumbnail_url}
                />
              ) : (
                <Image
                  src={validMedia[currentImageIndex].url}
                  alt={post.title ? `${post.title} - Image ${currentImageIndex + 1}` : `Post image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority={currentImageIndex === 0}
                  unoptimized={validMedia[currentImageIndex].url.includes('supabase.co')}
                />
              )
            )}
            
            {/* Navigation Arrows - Only show if multiple images */}
            {validMedia.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                  {currentImageIndex + 1} / {validMedia.length}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail Strip - Zillow Style */}
          {validMedia.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              {validMedia.map((media, idx) => {
                const mediaIsVideo = isVideo(media);
                return (
                  <button
                    key={`thumb-${media.url}-${idx}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 transition-colors ${
                      currentImageIndex === idx
                        ? 'border-gray-900'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    {mediaIsVideo ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-[10px] text-gray-600">Video</span>
                      </div>
                    ) : (
                      <Image
                        src={media.url}
                        alt={`Thumbnail ${idx + 1}`}
                        width={80}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized={media.url.includes('supabase.co')}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Map - Show in first column when no media */}
      {showMapInFirstColumn && (
        <div className="w-full">
          <div 
            className="w-full rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={onMapClick}
          >
            <PostMapRenderer 
              mapData={mapData}
              height="400px"
            />
          </div>
        </div>
      )}

    </article>
  );
}

