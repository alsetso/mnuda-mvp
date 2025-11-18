'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import type { CreateAdData, Ad } from '../types';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAd: (data: CreateAdData) => Promise<Ad>;
}

export function CreateAdModal({ isOpen, onClose, onCreateAd }: CreateAdModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [placement, setPlacement] = useState<'article_left' | 'article_right' | 'article_both'>('article_right');
  const [targetArticleSlug, setTargetArticleSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setError('Image is required');
      return;
    }

    if (!linkUrl.trim() || !linkUrl.match(/^https?:\/\//)) {
      setError('Valid link URL is required (must start with http:// or https://)');
      return;
    }

    if (!headline.trim()) {
      setError('Headline is required');
      return;
    }

    if (headline.length < 3 || headline.length > 100) {
      setError('Headline must be between 3 and 100 characters');
      return;
    }

    if (description.length > 300) {
      setError('Description cannot exceed 300 characters');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreateAd({
        image_url: imageUrl.trim(),
        link_url: linkUrl.trim(),
        headline: headline.trim(),
        description: description.trim() || null,
        placement,
        target_article_slug: targetArticleSlug.trim() || null,
        status,
      });
      
      // Reset form
      setImageUrl('');
      setLinkUrl('');
      setHeadline('');
      setDescription('');
      setPlacement('article_right');
      setTargetArticleSlug('');
      setStatus('draft');
      setError(null);
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setImageUrl('');
    setLinkUrl('');
    setHeadline('');
    setDescription('');
    setPlacement('article_right');
    setTargetArticleSlug('');
    setStatus('draft');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 p-6 pb-0">
            <h2 className="text-2xl font-bold text-black">Create Ad</h2>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Image <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(typeof url === 'string' ? url : '')}
                bucket="marketplace-images"
                table="ads"
                column="image_url"
                multiple={false}
                label="Upload ad image"
                disabled={isCreating}
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Link URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                disabled={isCreating}
                required
              />
            </div>

            {/* Headline */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Headline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => {
                  setHeadline(e.target.value);
                  setError(null);
                }}
                placeholder="Enter ad headline"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                disabled={isCreating}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {headline.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 300) {
                    setDescription(value);
                  }
                }}
                placeholder="Enter ad description..."
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                disabled={isCreating}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/300 characters
              </p>
            </div>

            {/* Placement */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Placement <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlacement('article_left')}
                  disabled={isCreating}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                    placement === 'article_left'
                      ? 'bg-gold-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setPlacement('article_right')}
                  disabled={isCreating}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                    placement === 'article_right'
                      ? 'bg-gold-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Right
                </button>
                <button
                  type="button"
                  onClick={() => setPlacement('article_both')}
                  disabled={isCreating}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                    placement === 'article_both'
                      ? 'bg-gold-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* Target Article Slug */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Target Article (optional)
              </label>
              <input
                type="text"
                value={targetArticleSlug}
                onChange={(e) => setTargetArticleSlug(e.target.value)}
                placeholder="e.g., under-dev-and-acq (leave empty for all articles)"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to show on all articles, or enter a specific article slug
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  disabled={isCreating}
                  className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors ${
                    status === 'draft'
                      ? 'bg-gold-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  disabled={isCreating}
                  className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors ${
                    status === 'active'
                      ? 'bg-gold-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !imageUrl.trim() || !linkUrl.trim() || !headline.trim()}
                className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Ad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

