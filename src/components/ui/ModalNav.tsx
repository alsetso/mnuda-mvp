'use client';

import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import React from 'react';

export interface ModalNavProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  actions?: React.ReactNode;
  sticky?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ModalNav({
  title,
  onClose,
  onBack,
  actions,
  sticky = false,
  disabled = false,
  className = '',
}: ModalNavProps) {
  const baseClasses = 'flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white';
  const stickyClasses = sticky ? 'sticky top-0 z-10' : '';
  const combinedClasses = `${baseClasses} ${stickyClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {onBack && (
          <button
            onClick={onBack}
            disabled={disabled}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
            aria-label="Back"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <button
          onClick={onClose}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}


