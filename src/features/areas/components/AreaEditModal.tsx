'use client';

import { useState, useEffect } from 'react';
import { Area, UpdateAreaData } from '../services/areaService';
import { useToast } from '@/features/ui/hooks/useToast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AreaEditModalProps {
  isOpen: boolean;
  area: Area | null;
  onClose: () => void;
  onEditShape: (area: Area) => void;
  onSave: (areaId: string, data: UpdateAreaData) => Promise<void>;
}

export function AreaEditModal({
  isOpen,
  area,
  onClose,
  onEditShape,
  onSave,
}: AreaEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [category, setCategory] = useState<'custom' | 'county' | 'city' | 'state' | 'region' | 'zipcode'>('custom');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && area) {
      setName(area.name);
      setDescription(area.description || '');
      setVisibility(area.visibility);
      setCategory(area.category || 'custom');
      setIsSaving(false);
    }
  }, [isOpen, area]);

  const handleSave = async () => {
    if (!area || !name.trim()) {
      error('Name Required', 'Please enter a name for your area');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateAreaData = {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        category,
      };

      await onSave(area.id, data);
      success('Area Updated', 'Your area has been updated successfully');
      onClose();
    } catch (err) {
      console.error('Error updating area:', err);
      error('Update Failed', err instanceof Error ? err.message : 'Failed to update area');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !area) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-black">Edit Area</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black"
              placeholder="Enter area name"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black resize-none"
              placeholder="Optional description"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black"
              disabled={isSaving}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black"
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

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onEditShape(area)}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Edit Shape
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
