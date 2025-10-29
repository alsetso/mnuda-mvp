"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/features/workspaces';
import PageLayout from '@/components/PageLayout';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const EMOJI_OPTIONS = [
  '🏢', '🏠', '🏭', '🏪', '🏬', '🏨', '🏩', '🏫', '🏯', '🏰',
  '💼', '📊', '📈', '📋', '📁', '🗂️', '📂', '📄', '📃', '📑',
  '🎯', '🚀', '⭐', '💡', '🔧', '⚙️', '🎭', '🎪', '🎨', '🎬',
  '👥', '👤', '🤝', '💬', '📞', '📧', '💻', '📱', '⌨️', '🖥️'
];

export default function NewWorkspacePage() {
  const router = useRouter();
  const { createWorkspace } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🏢',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const workspace = await createWorkspace({
        name: formData.name.trim(),
        emoji: formData.emoji,
        description: formData.description.trim()
      });
      
      // Redirect to the new workspace
      router.push(`/workspace/${workspace.id}`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      setError(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({ ...prev, emoji }));
  };

  return (
    <PageLayout containerMaxWidth="2xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Workspace</h1>
            <p className="text-gray-600 mt-2">Set up a new workspace for your team</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Emoji Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose an emoji
              </label>
              <div className="grid grid-cols-8 gap-2 p-4 bg-white rounded-lg border border-gray-200">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-10 h-10 text-2xl rounded-lg border-2 transition-colors hover:bg-gray-50 ${
                      formData.emoji === emoji
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Workspace Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter workspace name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this workspace is for (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Preview */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{formData.emoji}</span>
                <div>
                  <div className="font-semibold text-gray-900">
                    {formData.name || 'Workspace Name'}
                  </div>
                  {formData.description && (
                    <div className="text-sm text-gray-600">{formData.description}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || isCreating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckIcon className="w-4 h-4" />
                )}
                <span>{isCreating ? 'Creating...' : 'Create Workspace'}</span>
              </button>
            </div>
          </form>
    </PageLayout>
  );
}
