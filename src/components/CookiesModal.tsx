'use client';

import React from 'react';
import { locationService } from '@/lib/locationService';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  onDecline 
}) => {
  const handleAccept = () => {
    locationService.setPermissionResponse('granted');
    onAccept();
  };

  const handleDecline = () => {
    locationService.setPermissionResponse('denied');
    onDecline();
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* Location Icon */}
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
              Enable Location Services
            </h2>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4 leading-relaxed">
            MNuda uses your location to show nearby properties and provide accurate directions. 
            Your location data is processed securely and never shared with third parties.
          </p>
          
          {/* Links */}
          <div className="mb-6">
            <a 
              href="#" 
              className="text-mnuda-light-blue hover:text-mnuda-dark-blue underline mr-4"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="text-mnuda-light-blue hover:text-mnuda-dark-blue underline"
            >
              Terms of Service
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAccept}
              className="flex-1 bg-mnuda-dark-blue text-white px-4 py-3 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Allow Location</span>
            </button>
            
            <button
              onClick={handleDecline}
              className="flex-1 bg-gray-200 text-mnuda-dark-blue px-4 py-3 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>No Thanks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
