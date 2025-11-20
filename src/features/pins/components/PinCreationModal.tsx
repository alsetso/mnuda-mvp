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
  addMarker?: (id: string, coordinates: { lat: number; lng: number }, options?: { element?: HTMLElement; color?: string; popupContent?: string }) => void;
  removeMarker?: (id: string) => void;
}

export function PinCreationModal({
  isOpen,
  coordinates,
  address,
  onClose,
  onSave,
  addMarker,
  removeMarker,
}: PinCreationModalProps) {
  const [emoji, setEmoji] = useState('📍');
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();
  const TEMP_PIN_MARKER_ID = 'temp-pin-marker';

  // Create temporary marker element with emoji and blue glowing ring
  const createTempMarkerElement = (emojiValue: string): HTMLElement => {
    const markerContainer = document.createElement('div');
    markerContainer.className = 'temp-pin-marker';
    markerContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transform: translate(-50%, -50%);
    `;

    // Blue glowing ring
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid #3B82F6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3),
                  0 0 0 4px rgba(59, 130, 246, 0.2),
                  0 0 20px rgba(59, 130, 246, 0.4),
                  0 0 40px rgba(59, 130, 246, 0.2);
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `;

    // Emoji container
    const emojiContainer = document.createElement('div');
    emojiContainer.style.cssText = `
      position: relative;
      z-index: 1;
      font-size: 28px;
      line-height: 1;
      text-align: center;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    emojiContainer.textContent = emojiValue;

    markerContainer.appendChild(ring);
    markerContainer.appendChild(emojiContainer);

    // Add animation keyframes if not already added
    if (!document.getElementById('temp-pin-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'temp-pin-marker-styles';
      style.textContent = `
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    return markerContainer;
  };

  // Update temporary marker when dialog opens or emoji changes
  useEffect(() => {
    if (!isOpen || !addMarker || !removeMarker) {
      // Remove marker when dialog closes
      if (removeMarker) {
        removeMarker(TEMP_PIN_MARKER_ID);
      }
      return;
    }

    // Validate coordinates before adding marker
    if (!coordinates ||
        typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number' ||
        isNaN(coordinates.lat) || isNaN(coordinates.lng) ||
        !isFinite(coordinates.lat) || !isFinite(coordinates.lng)) {
      if (removeMarker) {
        removeMarker(TEMP_PIN_MARKER_ID);
      }
      return;
    }

    // Add or update temporary marker
    const markerElement = createTempMarkerElement(emoji);
    addMarker(TEMP_PIN_MARKER_ID, coordinates, {
      element: markerElement,
    });

    // Cleanup on unmount
    return () => {
      if (removeMarker) {
        removeMarker(TEMP_PIN_MARKER_ID);
      }
    };
  }, [isOpen, emoji, coordinates, addMarker, removeMarker]);

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
    <div className="pointer-events-auto mx-auto backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30"
      style={{ maxWidth: '30rem' }}
      onClick={(e) => e.stopPropagation()}
    >
        <div className="p-4 space-y-3">
          {/* Header with close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <span className="text-lg">{emoji}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create Pin</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">New location marker</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 transition-all"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Visibility - compact pill */}
          <div>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
              disabled={isSaving}
            >
              <option value="public">🌍 Public</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>

          {/* Emoji and Name - inline */}
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0">
              <EmojiSelectorPopup
                value={emoji}
                onChange={setEmoji}
                buttonSize="md"
              />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pin name *"
              className="flex-1 px-3.5 py-2.5 text-sm font-medium rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
              disabled={isSaving}
              autoFocus
            />
          </div>

          {/* Location with coordinates - compact glass */}
          <div className="px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 dark:text-gray-500 mt-0.5 text-xs">📍</span>
              <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{address}</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 pl-5 font-mono tracking-tight">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </div>
          </div>

          {/* Description - centered compact */}
          <div className="flex justify-center">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full max-w-xs px-3.5 py-2.5 text-sm font-medium rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none backdrop-blur-sm transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Actions - iOS style buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
  );
}

