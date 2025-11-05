"use client";

import React, { useState, useRef, useEffect } from 'react';

const EMOJI_OPTIONS = [
  '🏢', '🏠', '🏭', '🏪', '🏬', '🏨', '🏩', '🏫', '🏯', '🏰',
  '💼', '📊', '📈', '📋', '📁', '🗂️', '📂', '📄', '📃', '📑',
  '🎯', '🚀', '⭐', '💡', '🔧', '⚙️', '🎭', '🎪', '🎨', '🎬',
  '👥', '👤', '🤝', '💬', '📞', '📧', '💻', '📱', '⌨️', '🖥️'
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
        className={`${sizeClasses[buttonSize]} rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center bg-white ${
          isOpen ? 'border-gold-500 bg-gold-50' : ''
        }`}
        title="Click to select emoji"
      >
        {value || '🏢'}
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
            className="absolute z-50 mt-2 p-3 bg-white rounded-lg border border-gray-200 shadow-lg"
            style={{
              minWidth: '280px',
              maxWidth: '320px',
              left: '0',
              top: '100%'
            }}
          >
            <div className="text-xs font-medium text-gray-700 mb-2 px-1">
              Select emoji
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-64 overflow-y-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-8 h-8 text-lg rounded transition-colors hover:bg-gray-100 flex items-center justify-center ${
                    value === emoji
                      ? 'bg-gold-100 border-2 border-gold-500'
                      : 'border border-transparent'
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

