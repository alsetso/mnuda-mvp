'use client';

import { EyeIcon } from '@heroicons/react/24/outline';

interface ViewsProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function Views({ count, className = '', size = 'md', showIcon = true }: ViewsProps) {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`flex items-center gap-1.5 text-gray-500 ${sizeClasses[size]} ${className}`}>
      {showIcon && <EyeIcon className={iconSizes[size]} aria-hidden="true" />}
      <span>
        {count.toLocaleString()} {count === 1 ? 'view' : 'views'}
      </span>
    </div>
  );
}



