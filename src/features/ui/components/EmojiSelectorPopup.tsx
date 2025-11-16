"use client";

import React, { useState, useRef, useEffect } from 'react';

const EMOJI_OPTIONS = [
  '🏠', // House
  '🏚️', // Rundown House
  '🏢', // Apartment
  '🚗', // Car
  '📦', // Box
  '💰', // Money Bag
];

interface EmojiSelectorPopupProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
}

export function EmojiSelectorPopup({ 
  value, 
  onChange, 
  className = '',
  buttonSize = 'md'
}: EmojiSelectorPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl'
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isOpen]);

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[buttonSize]} rounded-xl border-2 border-white/20 hover:border-white/40 transition-all flex items-center justify-center bg-white/10 backdrop-blur-sm ${
          isOpen ? 'border-blue-500/50 bg-blue-500/20' : ''
        }`}
        title="Select emoji"
      >
        {value || '🏠'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popup */}
          <div
            ref={popupRef}
            className="absolute z-50 mt-2 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-white/50 shadow-2xl"
            style={{
              minWidth: '280px',
              maxWidth: '320px',
              left: '0',
              top: '100%'
            }}
          >
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg transition-all hover:bg-white/20 flex items-center justify-center ${
                    value === emoji
                      ? 'bg-blue-500/20 border-2 border-blue-500/50'
                      : 'border border-transparent hover:border-white/30'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

