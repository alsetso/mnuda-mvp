'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import FeedPost, { FeedPostData } from './FeedPost';
import { PostCreationCard } from '@/features/posts';
import MnudaHeroCard from './MnudaHeroCard';
import CitiesAndCountiesSidebar from '@/components/locations/CitiesAndCountiesSidebar';
import AccountViewsCard from './AccountViewsCard';
import PagesCard from './PagesCard';
import NavigationCard from './NavigationCard';
import CompactFooter from './CompactFooter';
import FeedStatsCard from './FeedStatsCard';
import { AccountService, Account } from '@/features/auth';
import { useAuth } from '@/features/auth';
import { usePageView } from '@/hooks/usePageView';

interface City {
  id: string;
  name: string;
  slug: string;
  population: string;
  county: string;
}

interface County {
  id: string;
  name: string;
  slug: string;
  population: string;
  area: string;
}

interface FeedListClientProps {
  cities: City[];
  counties: County[];
}

export default function FeedListClient({ cities, counties }: FeedListClientProps) {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [posts, setPosts] = useState<FeedPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0); // Use ref to avoid dependency issues
  const cursorRef = useRef<string | null>(null); // For keyset pagination

  // Track feed page views
  usePageView({
    entity_type: 'feed',
    entity_slug: 'feed',
    enabled: true,
  });

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      if (!user) {
        setAccount(null);
        return;
      }

      try {
        const accountData = await AccountService.getCurrentAccount();
        setAccount(accountData);
      } catch (error) {
        console.error('Error loading account:', error);
        setAccount(null);
      }
    };

    loadAccount();
  }, [user]);

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) {
      offsetRef.current = 0;
      cursorRef.current = null;
      setIsLoading(true);
      setError(null);
    }
    
    try {
      // Prefer keyset pagination (cursor) over OFFSET
      const url = new URL('/api/feed', window.location.origin);
      url.searchParams.set('limit', '10');
      
      if (cursorRef.current) {
        url.searchParams.set('cursor', cursorRef.current);
      } else {
        url.searchParams.set('offset', offsetRef.current.toString());
      }
      
      const response = await fetch(url.toString(), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          if (reset) {
            setPosts([]);
          }
          setHasMore(false);
          setIsLoading(false);
          return;
        }
        
        let errorData: Record<string, unknown> = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.error || errorData.details || `Failed to fetch feed (${response.status})`);
      }
      
      const data = await response.json();
      
      // Update cursor for next page
      if (data.nextCursor) {
        cursorRef.current = data.nextCursor;
      }
      
      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      }
      
      setHasMore(data.hasMore || false);
      offsetRef.current += (data.posts?.length || 0);
    } catch (error) {
      console.error('Error fetching feed:', error);
      setError(error instanceof Error ? error.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ No dependencies - uses refs

  // Load feed on mount
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setIsLoading(true);
      fetchPosts();
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="text-center text-gray-500 text-xs">Loading feed...</div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-xs text-red-600 mb-2">{error}</p>
          <button
            onClick={() => fetchPosts(true)}
            className="text-xs text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Sidebar - Fixed, no scroll */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="lg:sticky lg:top-20 space-y-3 lg:[max-height:calc(100vh-5rem)]">
            <AccountViewsCard account={account} />
            <PagesCard account={account} />
            <NavigationCard />
          </div>
        </div>

        {/* Main Content - Feed */}
        <div className="lg:col-span-6">
          {/* Hero Card */}
          <MnudaHeroCard />
          
          {/* Create Post Card */}
          <PostCreationCard onPostCreated={handlePostCreated} />

          {/* Feed Posts */}
          <div className="space-y-3 mt-3">
            {posts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-md p-6 text-center">
                <p className="text-gray-500 mb-2 text-xs">No posts yet.</p>
                <p className="text-xs text-gray-400">Be the first to share something with the Minnesota community!</p>
              </div>
            ) : (
              posts.map((post) => (
                <FeedPost key={post.id} post={post} onUpdate={handlePostCreated} />
              ))
            )}
          </div>

          {/* Error message if posts exist but error occurred */}
          {error && posts.length > 0 && (
            <div className="mt-3 text-center text-xs text-red-600">
              {error} <button onClick={() => fetchPosts()} className="underline">Retry</button>
            </div>
          )}

          {/* Load More */}
          {posts.length > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={handleLoadMore}
                disabled={!hasMore || isLoading || !!error}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                {isLoading ? 'Loading...' : hasMore ? 'Load More' : 'No more posts'}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Scrolls with page, then sticks when both cards visible */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="space-y-3">
            <FeedStatsCard />
            <CitiesAndCountiesSidebar cities={cities} counties={counties} />
            <CompactFooter />
          </div>
        </div>
      </div>
    </div>
  );
}

