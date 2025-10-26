'use client';

import { useState, useEffect } from 'react';
import { SessionData } from '../services/sessionStorage';

interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: SessionData | null;
  onUpdateSession: (updates: {
    name: string;
    description: string;
    isActive: boolean;
    locationTrackingActive: boolean;
  }) => Promise<void>;
}

export default function SessionSettingsModal({
  isOpen,
  onClose,
  currentSession,
  onUpdateSession,
}: SessionSettingsModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [locationTrackingActive, setLocationTrackingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with current session data
  useEffect(() => {
    if (currentSession) {
      setName(currentSession.name);
      setDescription(currentSession.description || '');
      setIsActive(currentSession.isActive);
      setLocationTrackingActive(currentSession.locationTrackingActive);
    }
  }, [currentSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    setIsLoading(true);
    try {
      await onUpdateSession({
        name,
        description,
        isActive,
        locationTrackingActive,
      });
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Session Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Session Name */}
          <div>
            <label htmlFor="session-name" className="block text-sm font-medium text-gray-700 mb-1">
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014463] focus:border-transparent"
              placeholder="Enter session name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="session-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="session-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014463] focus:border-transparent"
              placeholder="Enter session description"
              rows={3}
            />
          </div>

          {/* Active Session Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="is-active" className="text-sm font-medium text-gray-700">
                Active Session
              </label>
              <p className="text-xs text-gray-500">Make this the current active session</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="is-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#014463]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#014463]"></div>
            </label>
          </div>

          {/* Location Tracking Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="location-tracking" className="text-sm font-medium text-gray-700">
                Location Tracking
              </label>
              <p className="text-xs text-gray-500">Enable GPS tracking for this session</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="location-tracking"
                type="checkbox"
                checked={locationTrackingActive}
                onChange={(e) => setLocationTrackingActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#014463]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#014463]"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014463] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#014463] border border-transparent rounded-md hover:bg-[#1dd1f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014463] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
