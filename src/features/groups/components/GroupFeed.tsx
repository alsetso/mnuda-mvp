'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { GroupPost } from '../types';

interface GroupFeedProps {
  groupId: string;
  posts: GroupPost[];
  canPost: boolean;
  canView: boolean;
  onCreatePost: (content: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  currentUserId?: string;
  isLoading?: boolean;
}

export function GroupFeed({
  groupId,
  posts,
  canPost,
  canView,
  onCreatePost,
  onDeletePost,
  currentUserId,
  isLoading = false,
}: GroupFeedProps) {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || isSubmitting || !canPost) return;

    setIsSubmitting(true);
    try {
      await onCreatePost(newPost.trim());
      setNewPost('');
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setDeletingPostId(postId);
    try {
      await onDeletePost(postId);
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setDeletingPostId(null);
    }
  };

  const getAuthorInitial = (post: GroupPost): string => {
    if (post.user?.name) {
      return post.user.name.charAt(0).toUpperCase();
    }
    if (post.user?.email) {
      return post.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getAuthorName = (post: GroupPost): string => {
    return post.user?.name || post.user?.email?.split('@')[0] || 'Anonymous';
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Post Input - More compact */}
      {canPost && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex gap-3">
            <textarea
              value={newPost}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setNewPost(value);
                }
              }}
              placeholder="What's happening in this group?"
              maxLength={500}
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none text-sm sm:text-base"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newPost.trim() || isSubmitting}
              className="px-4 sm:px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end shadow-sm"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Post</span>
                  <PaperAirplaneIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
          {newPost.length > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-right">
              {newPost.length}/500
            </p>
          )}
        </form>
      )}

      {/* Posts List - Better spacing */}
      <div className="space-y-3">
        {!canView ? (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-600 font-medium mb-1">Feed is members-only</p>
            <p className="text-sm text-gray-500">
              Join the group to view posts and participate in discussions.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-600 font-medium mb-1">No posts yet.</p>
            <p className="text-sm text-gray-500">
              {canPost ? 'Be the first to post!' : 'Join the group to start posting.'}
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const isOwnPost = currentUserId === post.user_id;
            
            return (
              <div
                key={post.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gold-200 transition-colors shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {post.user?.avatar_url ? (
                      <img
                        src={post.user.avatar_url}
                        alt={getAuthorName(post)}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center ring-2 ring-gray-100">
                        <span className="text-gold-600 font-semibold text-sm">
                          {getAuthorInitial(post)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-black text-sm sm:text-base">
                        {getAuthorName(post)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(post.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Delete Button */}
                  {isOwnPost && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingPostId === post.id}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Delete post"
                    >
                      {deletingPostId === post.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

