'use client';

import { useState, useRef, useEffect } from 'react';

interface TitleEditProps {
  title: string;
  onSave: (newTitle: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function TitleEdit({ 
  title, 
  onSave, 
  className = '', 
  placeholder = 'Enter title...',
  maxLength = 100,
  disabled = false
}: TitleEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editValue when title prop changes
  useEffect(() => {
    setEditValue(title);
  }, [title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== title) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to fire first
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        maxLength={maxLength}
        className={`bg-transparent border-b-2 border-blue-500 outline-none text-sm font-semibold text-gray-800 min-w-0 flex-1 ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`cursor-pointer group relative min-w-0 flex-1 ${className}`}
      title={disabled ? 'Title editing disabled' : 'Click to edit title'}
    >
      <span className="text-sm font-semibold text-gray-800 truncate block">
        {title}
      </span>
      
      {/* Edit icon - only show on hover and when not disabled */}
      {isHovered && !disabled && (
        <svg
          className="absolute -right-5 top-0 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      )}
    </div>
  );
}
