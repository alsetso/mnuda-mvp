'use client';

import { useApiStatus, ApiStatus } from '../hooks/useApiStatus';

interface ApiStatusLabelProps {
  className?: string;
}

export default function ApiStatusLabel({ className = '' }: ApiStatusLabelProps) {
  const { status, lastChecked, error } = useApiStatus();

  const getStatusConfig = (status: ApiStatus) => {
    switch (status) {
      case 'online':
        return {
          dotColor: 'bg-green-500',
          textColor: 'text-gray-700',
          text: 'Online',
        };
      case 'offline':
        return {
          dotColor: 'bg-red-500',
          textColor: 'text-gray-700',
          text: 'Offline',
        };
      case 'checking':
        return {
          dotColor: 'bg-yellow-500',
          textColor: 'text-gray-700',
          text: 'Checking...',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <a
      href="/status"
      className={`inline-flex items-center space-x-2 text-xs font-medium hover:opacity-80 transition-opacity mr-4 ${className}`}
      title={
        lastChecked 
          ? `Last checked: ${lastChecked.toLocaleTimeString()}${error ? ` - ${error}` : ''} - Click for details`
          : 'API Status - Click for details'
      }
    >
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
      <span className={config.textColor}>{config.text}</span>
    </a>
  );
}
