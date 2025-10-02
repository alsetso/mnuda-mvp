'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateStorageUsage, formatBytes, getStorageQuota, StorageUsage } from '../services/storageUsage';
import { useAuth } from '@/features/auth';

interface UsageDropdownProps {
  className?: string;
}

export default function UsageDropdown({ className = '' }: UsageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [quota, setQuota] = useState<{ quota: number; usage: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const loadStorageData = async () => {
    setLoading(true);
    try {
      const usage = calculateStorageUsage();
      const quotaData = await getStorageQuota();
      setStorageUsage(usage);
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadStorageData();
    }
    setIsOpen(!isOpen);
  };

  const handleViewMore = () => {
    setIsOpen(false);
    router.push('/usage');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleViewMore();
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Usage Icon Button */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2"
        title="View storage usage"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg z-50 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Storage Usage</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-xs text-gray-500">Local</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1dd1f5] border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : storageUsage ? (
              <div className="space-y-4">
                {/* Total Usage */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total Storage</div>
                      {quota && quota.quota > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatBytes(quota.usage)} of {formatBytes(quota.quota)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatBytes(storageUsage.total)}
                      </div>
                      {quota && quota.quota > 0 && (
                        <div className="text-xs text-gray-500">
                          {((quota.usage / quota.quota) * 100).toFixed(1)}% used
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sessions Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium text-gray-900">{storageUsage.sessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Nodes</span>
                    <span className="font-medium text-gray-900">
                      {storageUsage.sessions.reduce((sum, s) => sum + s.session.nodes.length, 0)}
                    </span>
                  </div>
                </div>

                {/* Recent Sessions */}
                {storageUsage.sessions.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Recent Sessions
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {storageUsage.sessions
                        .sort((a, b) => b.session.lastAccessed - a.session.lastAccessed)
                        .slice(0, 3)
                        .map((sessionUsage) => (
                          <div key={sessionUsage.session.id} className="flex items-center justify-between text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 truncate">{sessionUsage.session.name}</div>
                              <div className="text-gray-500">
                                {sessionUsage.session.nodes.length} nodes • {formatDate(sessionUsage.session.lastAccessed)}
                              </div>
                            </div>
                            <div className="text-gray-500 ml-2">
                              {formatBytes(sessionUsage.size)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Cloud Status */}
                {user && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-600">Cloud Storage</span>
                      </div>
                      <span className="text-xs text-gray-500">Not synced</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-sm text-gray-500">Unable to load storage data</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleViewMore}
              className="w-full px-3 py-2 text-sm font-medium text-[#1dd1f5] bg-white border border-[#1dd1f5] rounded-md hover:bg-[#1dd1f5]/5 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 transition-colors"
            >
              View Full Usage Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
