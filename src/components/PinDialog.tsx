'use client';

import React, { useState, useEffect } from 'react';
import { PinDialogProps, CreatePinData } from '@/types/pin';

const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAddress,
  coordinates
}) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name for this location');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (name.trim().length > 100) {
      setError('Name must be less than 100 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pinData: CreatePinData = {
        name: name.trim(),
        lat: coordinates[1], // coordinates is [lng, lat]
        lng: coordinates[0],
        full_address: initialAddress
      };

      await onSave(pinData);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save pin';
      
      // Handle authentication errors specifically
      if (errorMessage.includes('authenticated')) {
        setError('Please log in to save location pins');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* Pin Icon */}
            <div className="w-10 h-10 bg-mnuda-light-blue rounded-full flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-mnuda-dark-blue">
              Save Location Pin
            </h2>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Address Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-mnuda-dark-blue mb-2">
              Address
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
              {initialAddress}
            </div>
          </div>

          {/* Coordinates Row */}
          <div className="mb-4 flex gap-4 text-xs text-gray-500">
            <div className="font-mono text-gray-700">{coordinates[1].toFixed(6)}</div>
            <div className="font-mono text-gray-700">{coordinates[0].toFixed(6)}</div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label htmlFor="pin-name" className="block text-sm font-medium text-mnuda-dark-blue mb-2">
              Pin Name *
            </label>
            <input
              id="pin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this location..."
              disabled={isLoading}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mnuda-light-blue focus:border-mnuda-light-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500">
              {name.length}/100 characters
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-mnuda-dark-blue px-4 py-3 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 bg-mnuda-dark-blue text-white px-4 py-3 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Save Pin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinDialog;
