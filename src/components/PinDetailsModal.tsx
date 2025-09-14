'use client';

import React from 'react';
import { Pin } from '@/types/pin';

interface PinDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: Pin | null;
}

const PinDetailsModal: React.FC<PinDetailsModalProps> = ({
  isOpen,
  onClose,
  pin
}) => {
  if (!isOpen || !pin) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* Pin Icon */}
            <div className="w-10 h-10 bg-mnuda-dark-blue rounded-full flex items-center justify-center">
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
            <div>
              <h2 className="text-xl font-bold text-mnuda-dark-blue">
                Pin Details
              </h2>
              <p className="text-sm text-gray-500">Location information</p>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pin Name */}
          <div>
            <label className="block text-sm font-medium text-mnuda-dark-blue mb-2">
              Pin Name
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-lg font-semibold text-mnuda-dark-blue">
                {pin.name}
              </h3>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-mnuda-dark-blue mb-2">
              Address
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-gray-700 leading-relaxed">
                {pin.full_address}
              </p>
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <label className="block text-sm font-medium text-mnuda-dark-blue mb-2">
              Coordinates
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-xs text-gray-500 mb-1">Latitude</div>
                <div className="font-mono text-sm text-gray-700">
                  {pin.lat.toFixed(6)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-xs text-gray-500 mb-1">Longitude</div>
                <div className="font-mono text-sm text-gray-700">
                  {pin.lng.toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-mnuda-dark-blue mb-2">
                Created
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm text-gray-700">
                  {formatDate(pin.created_at)}
                </div>
              </div>
            </div>
            {pin.updated_at !== pin.created_at && (
              <div>
                <label className="block text-sm font-medium text-mnuda-dark-blue mb-2">
                  Last Updated
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-sm text-gray-700">
                    {formatDate(pin.updated_at)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-mnuda-dark-blue px-4 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
            
            <button
              onClick={() => {
                // Copy coordinates to clipboard
                navigator.clipboard.writeText(`${pin.lat}, ${pin.lng}`);
                // You could add a toast notification here
              }}
              className="flex-1 bg-mnuda-light-blue text-mnuda-dark-blue px-4 py-3 rounded-md hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Coordinates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinDetailsModal;
