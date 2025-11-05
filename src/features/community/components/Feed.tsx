'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, ShareIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface FeedPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    workspace?: string;
  };
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  type: 'post' | 'announcement' | 'event' | 'news';
}

interface FeedProps {
  posts: FeedPost[];
}

export default function Feed({ posts }: FeedProps) {
  const [localPosts, setLocalPosts] = useState<FeedPost[]>(posts);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const handleLike = (postId: string) => {
    setLocalPosts(posts =>
      posts.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postDate.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {localPosts.map((post) => (
        <article
          key={post.id}
          className="bg-white border border-gold-200 rounded-xl p-6 hover:shadow-lg transition-all"
        >
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {post.author.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-black">{post.author.name}</h3>
                  {post.type === 'announcement' && (
                    <span className="px-2 py-0.5 bg-gold-200 text-gold-800 text-xs font-bold rounded-full">
                      Announcement
                    </span>
                  )}
                  {post.type === 'event' && (
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-bold rounded-full">
                      Event
                    </span>
                  )}
                  {post.type === 'news' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                      News
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {post.author.workspace && (
                    <>
                      <span>{post.author.workspace}</span>
                      <span>•</span>
                    </>
                  )}
                  <time>{formatTimeAgo(post.createdAt)}</time>
                </div>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.imageUrl && (
              <div className="mt-4 rounded-lg overflow-hidden">
                <img src={post.imageUrl} alt="Post" className="w-full h-auto" />
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gold-200">
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors group"
              >
                {post.isLiked ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                )}
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
                <ShareIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>
        </article>
      ))}

      {localPosts.length === 0 && (
        <div className="bg-white border border-gold-200 rounded-xl p-12 text-center">
          <p className="text-gray-600 mb-2">No posts yet</p>
          <p className="text-sm text-gray-500">Be the first to share something with the community!</p>
        </div>
      )}
    </div>
  );
}

