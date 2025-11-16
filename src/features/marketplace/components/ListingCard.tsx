'use client';

import Link from 'next/link';
import { ShoppingBagIcon, MapPinIcon, EyeIcon } from '@heroicons/react/24/outline';
import type { MarketplaceListing } from '../types';

interface ListingCardProps {
  listing: MarketplaceListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = (price: number, isFree: boolean) => {
    if (isFree) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  return (
    <Link
      href={`/market/${listing.id}`}
      className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200 block"
    >
      <div className="flex flex-col gap-4">
        {/* Image or Icon */}
        {listing.image_urls && listing.image_urls.length > 0 ? (
          <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
            <ShoppingBagIcon className="w-12 h-12 text-gold-600" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-black group-hover:text-gold-600 transition-colors line-clamp-2 flex-1">
              {listing.title}
            </h3>
            <span className="flex-shrink-0 px-2 py-1 bg-gold-100 text-gold-700 text-xs font-semibold rounded">
              {listing.listing_type === 'physical' ? 'Physical' : 'Digital'}
            </span>
          </div>
          
          {listing.description && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
              {listing.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gold-600">
              {formatPrice(listing.price, listing.is_free)}
            </div>
            
            <div className="flex items-center gap-3">
              {listing.pin && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="line-clamp-1">{listing.pin.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span>{listing.visit_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

