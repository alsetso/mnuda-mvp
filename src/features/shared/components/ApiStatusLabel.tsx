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
          color: 'bg-green-500',
          text: 'API Online',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: 'API Offline',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'checking':
        return {
          color: 'bg-yellow-500',
          text: 'Checking...',
          icon: (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <a
      href="/status"
      className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color} hover:opacity-80 transition-opacity ${className}`}
      title={
        lastChecked 
          ? `Last checked: ${lastChecked.toLocaleTimeString()}${error ? ` - ${error}` : ''} - Click for details`
          : 'API Status - Click for details'
      }
    >
      {config.icon}
      <span className="hidden sm:inline">{config.text}</span>
    </a>
  );
}
