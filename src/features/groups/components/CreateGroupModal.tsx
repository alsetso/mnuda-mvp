'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { EmojiSelectorPopup } from '@/features/ui/components/EmojiSelectorPopup';
import type { CreateGroupData, Group, GroupVisibility, FeedVisibility } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: CreateGroupData) => Promise<Group>;
}

export function CreateGroupModal({ isOpen, onClose, onCreateGroup }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [groupVisibility, setGroupVisibility] = useState<GroupVisibility>('public');
  const [feedVisibility, setFeedVisibility] = useState<FeedVisibility>('public');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    if (name.length < 3 || name.length > 100) {
      setError('Group name must be between 3 and 100 characters');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const group = await onCreateGroup({
        name: name.trim(),
        emoji: emoji || null,
        description: description.trim() || null,
        group_visibility: groupVisibility,
        feed_visibility: feedVisibility,
      });
      
      // Reset form
      setName('');
      setEmoji(null);
      setDescription('');
      setGroupVisibility('public');
      setFeedVisibility('public');
      setError(null);
      
      // Close modal and navigate will be handled by parent
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setName('');
    setEmoji(null);
    setDescription('');
    setGroupVisibility('public');
    setFeedVisibility('public');
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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Create Group</h2>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Enter group name"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                disabled={isCreating}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {name.length}/100 characters
              </p>
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Emoji (optional)
              </label>
              <EmojiSelectorPopup
                value={emoji || ''}
                onChange={(value) => setEmoji(value || null)}
              />
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
                  if (value.length <= 500) {
                    setDescription(value);
                  }
                }}
                placeholder="What is this group about?"
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                disabled={isCreating}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>

            {/* Group Visibility */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Group Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupVisibility"
                    value="public"
                    checked={groupVisibility === 'public'}
                    onChange={(e) => setGroupVisibility(e.target.value as GroupVisibility)}
                    className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                    disabled={isCreating}
                  />
                  <div>
                    <span className="text-sm font-medium text-black">Public</span>
                    <p className="text-xs text-gray-500">Visible in listings, anyone can join</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupVisibility"
                    value="unlisted"
                    checked={groupVisibility === 'unlisted'}
                    onChange={(e) => setGroupVisibility(e.target.value as GroupVisibility)}
                    className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                    disabled={isCreating}
                  />
                  <div>
                    <span className="text-sm font-medium text-black">Unlisted</span>
                    <p className="text-xs text-gray-500">Not in listings, accessible via direct link only</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Feed Visibility */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Feed Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="feedVisibility"
                    value="public"
                    checked={feedVisibility === 'public'}
                    onChange={(e) => setFeedVisibility(e.target.value as FeedVisibility)}
                    className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                    disabled={isCreating}
                  />
                  <div>
                    <span className="text-sm font-medium text-black">Public</span>
                    <p className="text-xs text-gray-500">Anyone can view posts</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="feedVisibility"
                    value="members_only"
                    checked={feedVisibility === 'members_only'}
                    onChange={(e) => setFeedVisibility(e.target.value as FeedVisibility)}
                    className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                    disabled={isCreating}
                  />
                  <div>
                    <span className="text-sm font-medium text-black">Members Only</span>
                    <p className="text-xs text-gray-500">Only members can view posts</p>
                  </div>
                </label>
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
                disabled={isCreating || !name.trim()}
                className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

