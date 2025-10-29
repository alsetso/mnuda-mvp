"use client";

import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface ActionDropdownProps<T = Record<string, unknown>> {
  record: T;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
}

export function ActionDropdown<T = Record<string, unknown>>({ record, onEdit, onDelete, onView }: ActionDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
        title="Actions"
      >
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {onView && (
              <button
                onClick={() => handleAction(() => onView(record))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>👁️</span>
                  <span>View Details</span>
                </div>
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={() => handleAction(() => onEdit(record))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>✏️</span>
                  <span>Edit</span>
                </div>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => handleAction(() => onDelete(record))}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>🗑️</span>
                  <span>Delete</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
