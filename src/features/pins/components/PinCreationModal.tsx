'use client';

import { useState, useEffect } from 'react';
import { EmojiSelectorPopup } from '@/features/ui/components/EmojiSelectorPopup';
import { useToast } from '@/features/ui/hooks/useToast';

interface PinCreationModalProps {
  isOpen: boolean;
  coordinates: { lat: number; lng: number };
  address: string;
  onClose: () => void;
  onSave: (data: {
    emoji: string;
    name: string;
    visibility: 'public' | 'private';
    description: string;
    address: string;
    lat: number;
    long: number;
  }) => Promise<void>;
}

export function PinCreationModal({
  isOpen,
  coordinates,
  address,
  onClose,
  onSave,
}: PinCreationModalProps) {
  const [emoji, setEmoji] = useState('📍');
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      setEmoji('📍');
      setName('');
      setVisibility('public');
      setDescription('');
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      error('Name Required', 'Please enter a name for your pin');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        emoji,
        name: name.trim(),
        visibility,
        description: description.trim() || '',
        address,
        lat: coordinates.lat,
        long: coordinates.lng,
      });
      success('Pin Created', 'Your pin has been saved');
      onClose();
    } catch (err) {
      error('Save Failed', err instanceof Error ? err.message : 'Failed to save pin');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Pin</h2>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Emoji and Name Row */}
            <div className="flex items-center gap-3">
              <EmojiSelectorPopup
                value={emoji}
                onChange={setEmoji}
                buttonSize="lg"
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter pin name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  disabled={isSaving}
                  autoFocus
                />
              </div>
            </div>

            {/* Address Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {address}
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  {coordinates.lat.toFixed(6)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  {coordinates.lng.toFixed(6)}
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                disabled={isSaving}
              >
                <option value="public">Public (visible to all members)</option>
                <option value="private">Private (only visible to you)</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || isSaving}
                className="flex-1 px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Pin'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

