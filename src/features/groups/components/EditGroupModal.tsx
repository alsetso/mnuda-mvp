'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { EmojiSelectorPopup } from '@/features/ui/components/EmojiSelectorPopup';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import type { Group, UpdateGroupData, GroupVisibility, FeedVisibility } from '../types';

interface EditGroupModalProps {
  isOpen: boolean;
  group: Group;
  onClose: () => void;
  onUpdateGroup: (groupId: string, data: UpdateGroupData) => Promise<Group>;
}

export function EditGroupModal({ isOpen, onClose, onUpdateGroup, group }: EditGroupModalProps) {
  const [name, setName] = useState(group.name);
  const [emoji, setEmoji] = useState<string | null>(group.emoji);
  const [description, setDescription] = useState(group.description || '');
  const [logoImageUrl, setLogoImageUrl] = useState(group.logo_image_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(group.cover_image_url || '');
  const [website, setWebsite] = useState(group.website || '');
  const [groupVisibility, setGroupVisibility] = useState<GroupVisibility>(group.group_visibility);
  const [feedVisibility, setFeedVisibility] = useState<FeedVisibility>(group.feed_visibility);
  const [requiresApproval, setRequiresApproval] = useState(group.requires_approval);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when group changes
  useEffect(() => {
    if (group) {
      setName(group.name);
      setEmoji(group.emoji);
      setDescription(group.description || '');
      setLogoImageUrl(group.logo_image_url || '');
      setCoverImageUrl(group.cover_image_url || '');
      setWebsite(group.website || '');
      setGroupVisibility(group.group_visibility);
      setFeedVisibility(group.feed_visibility);
      setRequiresApproval(group.requires_approval);
    }
  }, [group]);

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

    setIsUpdating(true);
    setError(null);

    // Validate website URL if provided
    if (website.trim() && !website.match(/^https?:\/\//)) {
      setError('Website must be a valid URL starting with http:// or https://');
      return;
    }

    try {
      await onUpdateGroup(group.id, {
        name: name.trim(),
        emoji: emoji || null,
        description: description.trim() || null,
        logo_image_url: logoImageUrl.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        website: website.trim() || null,
        group_visibility: groupVisibility,
        feed_visibility: feedVisibility,
        requires_approval: requiresApproval,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (isUpdating) return;
    setName(group.name);
    setEmoji(group.emoji);
    setDescription(group.description || '');
    setLogoImageUrl(group.logo_image_url || '');
    setCoverImageUrl(group.cover_image_url || '');
    setWebsite(group.website || '');
    setGroupVisibility(group.group_visibility);
    setFeedVisibility(group.feed_visibility);
    setRequiresApproval(group.requires_approval);
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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Edit Group</h2>
            <button
              onClick={handleClose}
              disabled={isUpdating}
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
                disabled={isUpdating}
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
                disabled={isUpdating}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>

            {/* Logo Image */}
            <ImageUpload
              value={logoImageUrl}
              onChange={(url) => setLogoImageUrl(url as string | null)}
              bucket="logos"
              table="groups"
              column="logo_image_url"
              multiple={false}
              label="Logo Image (optional)"
              disabled={isUpdating}
            />

            {/* Cover Image */}
            <ImageUpload
              value={coverImageUrl}
              onChange={(url) => setCoverImageUrl(url as string | null)}
              bucket="cover-photos"
              table="groups"
              column="cover_image_url"
              multiple={false}
              label="Cover Image (optional)"
              disabled={isUpdating}
            />

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Website URL (optional)
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must start with http:// or https://
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
                    disabled={isUpdating}
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
                    disabled={isUpdating}
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
                    disabled={isUpdating}
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
                    disabled={isUpdating}
                  />
                  <div>
                    <span className="text-sm font-medium text-black">Members Only</span>
                    <p className="text-xs text-gray-500">Only members can view posts</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Requires Approval */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="w-5 h-5 text-gold-500 focus:ring-gold-500 rounded"
                  disabled={isUpdating}
                />
                <div>
                  <span className="text-sm font-semibold text-black">Require Approval for New Members</span>
                  <p className="text-xs text-gray-500 mt-1">
                    New members must be approved before they can join. You can set up intake questions to collect information during the request.
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating || !name.trim()}
                className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

