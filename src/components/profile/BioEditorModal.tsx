'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AccountService } from '@/features/auth';

interface BioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBio: string | null;
  onSave: (bio: string | null) => void;
}

export default function BioEditorModal({
  isOpen,
  onClose,
  initialBio,
  onSave,
}: BioEditorModalProps) {
  const [bio, setBio] = useState(initialBio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBio(initialBio || '');
      setError(null);
    }
  }, [isOpen, initialBio]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const trimmedBio = bio.trim();
      const finalBio = trimmedBio.length > 0 ? trimmedBio : null;

      await AccountService.updateCurrentAccount({
        bio: finalBio,
      });

      onSave(finalBio);
      onClose();
    } catch (err) {
      console.error('Error updating bio:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(initialBio || '');
    setError(null);
    onClose();
  };

  const remainingChars = 220 - bio.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Bio</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={220}
              rows={4}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none resize-none"
              placeholder="Tell us about yourself..."
              disabled={isSaving}
            />
            <div className="mt-2 text-right text-xs text-gray-500">
              {remainingChars} characters remaining
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


