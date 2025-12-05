'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { UserIcon } from '@heroicons/react/24/outline';

type EntityType = 'post' | 'city' | 'county' | 'account' | 'business' | 'page';

interface PageView {
  id: string;
  viewed_at: string;
  account_id: string | null;
  account: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  } | null;
}

interface PageViewsListProps {
  entityType: EntityType;
  entityId?: string;
  entitySlug?: string;
  limit?: number;
}

export default function PageViewsList({ 
  entityType, 
  entityId, 
  entitySlug,
  limit = 50 
}: PageViewsListProps) {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageViews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          entity_type: entityType,
          limit: limit.toString(),
          offset: '0',
        });

        if (entityId) params.set('entity_id', entityId);
        if (entitySlug) params.set('entity_slug', entitySlug);

        const response = await fetch(`/api/analytics/page-views?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          // Silently handle permission errors - don't show component
          if (response.status === 403 || response.status === 500) {
            setError('permission_denied');
            setLoading(false);
            return;
          }
          setError(data.error || 'Failed to load page views');
          setLoading(false);
          return;
        }

        setPageViews(data.page_views || []);
      } catch (err) {
        // Silently handle errors - don't log to console
        setError('permission_denied');
      } finally {
        setLoading(false);
      }
    };

    fetchPageViews();
  }, [entityType, entityId, entitySlug, limit]);

  // Don't render anything if there's a permission error or still loading
  if (loading) {
    return null;
  }

  // Silently hide component on permission errors
  if (error === 'permission_denied' || error) {
    return null;
  }

  if (pageViews.length === 0) {
    return (
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-[10px] py-[10px] border-b border-gray-200 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-900">Page Views</h3>
        </div>
        <div className="p-[10px]">
          <p className="text-gray-500 text-xs text-center py-2">No page views yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      <div className="px-[10px] py-[10px] border-b border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-900">
          Page Views ({pageViews.length})
        </h3>
      </div>
      <div className="p-[10px] space-y-1.5 max-h-64 overflow-y-auto">
        {pageViews.map((view) => {
          const account = view.account;
          const displayName = account
            ? account.first_name && account.last_name
              ? `${account.first_name} ${account.last_name}`
              : account.username || account.first_name || 'Anonymous User'
            : 'Anonymous Visitor';

          return (
            <div
              key={view.id}
              className="flex items-center gap-2 p-[10px] rounded-md hover:bg-gray-50 transition-colors"
            >
              {account?.image_url ? (
                <Link
                  href={account.username ? `/profile/${account.username}` : `/accounts/${account.id}`}
                  className="flex-shrink-0"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden">
                    <Image
                      src={account.image_url}
                      alt={displayName}
                      width={28}
                      height={28}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized={account.image_url.includes('supabase.co')}
                    />
                  </div>
                </Link>
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {account ? (
                    <span className="text-gray-500 font-medium text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {account ? (
                  <Link
                    href={account.username ? `/profile/${account.username}` : `/accounts/${account.id}`}
                    className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors block truncate"
                  >
                    {displayName}
                  </Link>
                ) : (
                  <p className="text-xs font-medium text-gray-900 truncate">{displayName}</p>
                )}
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


