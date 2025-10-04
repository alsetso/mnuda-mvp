'use client';

import { ActionButton } from './EntityActionFramework';

interface UnifiedActionBarProps {
  actions: ActionButton[];
  context?: string;
  timestamp?: string;
}

export default function UnifiedActionBar({ 
  actions, 
  context, 
  timestamp 
}: UnifiedActionBarProps) {
  const getButtonStyles = (variant: string, disabled?: boolean) => {
    const baseStyles = "px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed";
    
    if (disabled) {
      return `${baseStyles} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} text-white bg-[#014463] hover:bg-[#1dd1f5]`;
      case 'danger':
        return `${baseStyles} text-white bg-red-600 hover:bg-red-700`;
      case 'secondary':
      default:
        return `${baseStyles} text-gray-700 bg-white hover:bg-gray-50 border border-gray-200`;
    }
  };

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {context && (
            <span className="text-sm text-gray-500">{context}</span>
          )}
          {timestamp && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{timestamp}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={getButtonStyles(action.variant, action.disabled)}
              title={action.tooltip || action.label}
            >
              <span className="text-xs">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
