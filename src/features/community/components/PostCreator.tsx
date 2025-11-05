'use client';

import { useState } from 'react';
import { PhotoIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth';

interface PostCreatorProps {
  onCreatePost: (content: string) => void;
  placeholder?: string;
}

export default function PostCreator({ onCreatePost, placeholder = "What's happening in Minnesota real estate?" }: PostCreatorProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreatePost(content.trim());
      setContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="bg-white border border-gold-200 rounded-xl p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{userInitial}</span>
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-sm"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-black hover:bg-gold-50 rounded-lg transition-colors"
                title="Add photo"
              >
                <PhotoIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${content.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                  {content.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <span>Post</span>
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

