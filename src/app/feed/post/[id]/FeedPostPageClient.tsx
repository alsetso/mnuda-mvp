'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { PencilIcon } from '@heroicons/react/24/outline';
import FeedPost, { FeedPostData } from '@/components/feed/FeedPost';
import LoginOverlayModal from '@/components/feed/LoginOverlayModal';
import EditPostModal from '@/components/feed/EditPostModal';
import { useAuth, AccountService, Account } from '@/features/auth';
import Views from '@/components/ui/Views';
import { usePageView } from '@/hooks/usePageView';
import PageViewsList from '@/components/analytics/PageViewsList';

interface FeedPostPageClientProps {
  postId: string;
  initialPost?: FeedPostData;
  requiresAuth?: boolean;
}

export default function FeedPostPageClient({ 
  postId, 
  initialPost,
  requiresAuth = false,
  structuredData
}: FeedPostPageClientProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);

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

  // Track page view using standard usePageView hook
  // This automatically tracks to page_views table and increments posts.view_count
  usePageView({
    entity_type: 'post',
    entity_id: postId,
    enabled: !!postId && !requiresAuth,
  });

  const [post, setPost] = useState<FeedPostData | null>(initialPost || null);
  const [isLoading, setIsLoading] = useState(!initialPost);
  const [showLoginModal, setShowLoginModal] = useState(requiresAuth);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if current user owns this post
  const canEdit = user && post && account?.id === (post as { account_id?: string }).account_id;

  const handlePostUpdate = async () => {
    // Refresh the post data after update
    try {
      const response = await fetch(`/api/feed/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error refreshing post:', error);
    }
    router.refresh();
  };

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setIsLoading(false);
      return;
    }

    if (requiresAuth) {
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/feed/${postId}`);
        
        if (response.status === 401) {
          setShowLoginModal(true);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        setPost(data.post);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, initialPost, requiresAuth]);

  useEffect(() => {
    // If user logs in, refresh the post
    if (user && showLoginModal) {
      setShowLoginModal(false);
      router.refresh();
    }
  }, [user, showLoginModal, router]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-xs text-gray-600">Loading post...</div>
        </div>
      </div>
    );
  }

  if (requiresAuth && !user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-[10px] py-3 w-full">
            <div className="bg-white border border-gray-200 rounded-md p-[10px] text-center">
              <h1 className="text-sm font-semibold text-gray-900 mb-3">Members Only Post</h1>
              <p className="text-xs text-gray-600 mb-3">
                This post is only available to MNUDA members. Please sign in to view.
              </p>
              <Link
                href="/login"
                className="inline-block px-[10px] py-[10px] bg-gray-900 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <LoginOverlayModal 
          isOpen={showLoginModal} 
          onClose={() => {
            setShowLoginModal(false);
            router.push('/');
          }}
          onLogin={() => router.refresh()}
        />
      </>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-gray-900 mb-3">Post Not Found</h1>
          <p className="text-xs text-gray-600 mb-3">The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link
            href="/"
            className="inline-block px-[10px] py-[10px] bg-gray-900 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            Go to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Structured Data for SEO - removed, using simple posts only */}
      
      {/* Inline Page Design - Unique Format */}
      <div className="min-h-screen bg-gray-50">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-[10px]">
            <div className="flex items-center justify-between h-12">
              {/* Left: Emblem + Back Arrow */}
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="flex items-center transition-opacity hover:opacity-80"
                  aria-label="MNUDA Home"
                >
                  <Image
                    src="/mnuda_emblem.png"
                    alt="MNUDA Emblem"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                    priority
                  />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
              </div>

              {/* Right: Edit Button (if owner) */}
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 px-[10px] py-[10px] text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <Views count={post.view_count || 0} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-[10px] py-3 space-y-3">
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            <FeedPost post={post} onUpdate={() => router.refresh()} disableNavigation={true} />
          </div>
          
          {/* Page Views List */}
          <PageViewsList
            entityType="post"
            entityId={postId}
          />
        </div>

        {/* Edit Post Modal */}
        {post && (
          <EditPostModal
            isOpen={showEditModal}
            post={post}
            onClose={() => setShowEditModal(false)}
            onUpdate={handlePostUpdate}
          />
        )}
      </div>
    </>
  );
}


