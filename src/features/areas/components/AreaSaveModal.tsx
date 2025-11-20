'use client';

import { useState, useEffect } from 'react';
import { AreaService, CreateAreaData } from '../services/areaService';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import { useToast } from '@/features/ui/hooks/useToast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AreaSaveModalProps {
  isOpen: boolean;
  geometry: GeoJSON.Geometry | null;
  onClose: () => void;
  onSave: () => Promise<void>;
}

export function AreaSaveModal({
  isOpen,
  geometry,
  onClose,
  onSave,
}: AreaSaveModalProps) {
  const { selectedProfile } = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [category, setCategory] = useState<'custom' | 'county' | 'city' | 'state' | 'region' | 'zipcode'>('custom');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setVisibility('public');
      setCategory('custom');
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!geometry) {
      error('Invalid Geometry', 'No area geometry to save');
      return;
    }

    if (!name.trim()) {
      error('Name Required', 'Please enter a name for your area');
      return;
    }

    if (!selectedProfile) {
      error('Profile Required', 'Please select a profile to save this area');
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateAreaData = {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        category,
        geometry,
      };

      await AreaService.createArea(data, selectedProfile.id);
      success('Area Saved', 'Your area has been saved successfully');
      await onSave();
      onClose();
    } catch (err) {
      console.error('Error saving area:', err);
      error('Save Failed', err instanceof Error ? err.message : 'Failed to save area');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-end justify-center pb-32 pointer-events-none">
      <div 
        className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 w-full max-w-sm mx-4 pointer-events-auto transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-black text-black">Save Area</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={isSaving}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Form */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black"
              placeholder="Area name"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black"
                disabled={isSaving}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black"
                disabled={isSaving}
              >
                <option value="custom">Custom</option>
                <option value="county">County</option>
                <option value="city">City</option>
                <option value="state">State</option>
                <option value="region">Region</option>
                <option value="zipcode">Zipcode</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black resize-none"
              placeholder="Brief description"
              rows={2}
              disabled={isSaving}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 px-4 py-2.5 text-sm bg-black text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
