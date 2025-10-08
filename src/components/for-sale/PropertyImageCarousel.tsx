'use client';

import { useState } from 'react';
import NextImage from 'next/image';

interface PropertyImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function PropertyImageCarousel({ 
  images, 
  alt, 
  className = '' 
}: PropertyImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Don't render if no images
  if (!images || images.length === 0) {
    return (
      <div className={`relative h-64 md:h-80 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className={`relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden bg-gray-200 ${className}`}>
      {/* Main Image */}
      <NextImage
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 800px, 1200px"
        quality={85}
        priority={currentIndex === 0}
      />
      
      {/* Navigation Arrows - Only show if more than 1 image */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Image Counter */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
