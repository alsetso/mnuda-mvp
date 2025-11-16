'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import { AreaService, CreateAreaData, AreaCategory } from '../services/areaService';
import { MemberService, Member } from '@/features/auth/services/memberService';
import { useAuth } from '@/features/auth';

interface AreaSaveModalProps {
  isOpen: boolean;
  geometry: GeoJSON.Geometry | null;
  onClose: () => void;
  onSave: () => void;
}

export function AreaSaveModal({ isOpen, geometry, onClose, onSave }: AreaSaveModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [category, setCategory] = useState<AreaCategory>('custom');
  const [isSaving, setIsSaving] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { success, error } = useToast();

  // Fetch member data to check admin role
  useEffect(() => {
    const fetchMember = async () => {
      if (user && isOpen) {
        try {
          const memberData = await MemberService.getCurrentMember();
          setMember(memberData);
          
          // Debug logging
          console.log('[AreaSaveModal] Member data:', memberData);
          console.log('[AreaSaveModal] Member role:', memberData?.role);
          console.log('[AreaSaveModal] Is admin?', memberData?.role === 'admin');
          
          setIsAdmin(memberData?.role === 'admin');
        } catch (err) {
          console.error('[AreaSaveModal] Error fetching member:', err);
          setIsAdmin(false);
        }
      } else {
        setMember(null);
        setIsAdmin(false);
      }
    };

    fetchMember();
  }, [user, isOpen]);

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
    if (!geometry || !name.trim()) {
      error('Name Required', 'Please enter a name for your area');
      return;
    }

    setIsSaving(true);
    try {
      const areaData: CreateAreaData = {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        category: isAdmin ? category : 'custom', // Only admins can set category
        geometry,
      };

      // Debug logging
      console.log('[AreaSaveModal] Creating area with data:', {
        ...areaData,
        geometry: 'GeoJSON geometry',
        isAdmin,
        memberRole: member?.role,
      });

      await AreaService.createArea(areaData);
      success('Area Saved', 'Your area has been saved');
      onSave();
      onClose();
    } catch (err) {
      error('Save Failed', err instanceof Error ? err.message : 'Failed to save area');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !geometry) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Save Area
            </h2>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter area name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isSaving}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    visibility === 'public'
                      ? 'bg-gold-500 text-white border-gold-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    visibility === 'private'
                      ? 'bg-gold-500 text-white border-gold-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Category - Admin Only */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Geographic Category <span className="text-xs text-gray-500">(Admin Only)</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AreaCategory)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="custom">Custom</option>
                  <option value="county">County</option>
                  <option value="city">City</option>
                  <option value="state">State</option>
                  <option value="region">Region</option>
                  <option value="zipcode">ZIP Code</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Categorized areas can be used for view layers and filtering
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

