'use client';

import { useState, useEffect } from 'react';
import { calculateStorageUsage, formatBytes, getStorageQuota, clearEmptySessions, StorageUsage } from '@/lib/storageUsage';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSwitch?: (sessionId: string) => void;
}

export default function UsageModal({ isOpen, onClose, onSessionSwitch }: UsageModalProps) {
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [quota, setQuota] = useState<{ quota: number; usage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStorageData();
    }
  }, [isOpen]);

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearEmptySessions = async () => {
    if (!storageUsage) return;
    
    const emptySessions = storageUsage.sessions.filter(s => s.session.nodes.length === 0);
    if (emptySessions.length === 0) {
      alert('No empty sessions found to clear.');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${emptySessions.length} empty session${emptySessions.length > 1 ? 's' : ''}?\n\nSessions to be deleted:\n${emptySessions.map(s => `• ${s.session.name}`).join('\n')}`;
    
    if (confirm(confirmMessage)) {
      setClearing(true);
      try {
        const result = clearEmptySessions();
        alert(`Successfully deleted ${result.deletedCount} empty session${result.deletedCount > 1 ? 's' : ''}.`);
        await loadStorageData(); // Refresh the data
      } catch (error) {
        console.error('Error clearing empty sessions:', error);
        alert('Error clearing empty sessions. Please try again.');
      } finally {
        setClearing(false);
      }
    }
  };

  const handleSessionClick = (sessionId: string) => {
    if (onSessionSwitch) {
      onSessionSwitch(sessionId);
      onClose(); // Close the modal after switching
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-[#1dd1f5]';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-[#1dd1f5]/10 rounded-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Storage Usage</h2>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Local storage usage breakdown</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dd1f5]"></div>
                <span className="ml-3 text-gray-600">Loading storage data...</span>
              </div>
            ) : storageUsage ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Total Usage Summary - Compact */}
                <div className="flex items-center justify-between text-sm text-gray-500 pb-4">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <span className="truncate">Total usage</span>
                    {quota && quota.quota > 0 && (
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        ({formatBytes(quota.usage)} of {formatBytes(quota.quota)})
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 flex-shrink-0">{formatBytes(storageUsage.total)}</span>
                </div>

                {/* Sessions Table */}
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Sessions</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full divide-y divide-gray-200 min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                            Session
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                            Nodes
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 hidden sm:table-cell">
                            Created
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                            Size
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Usage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {storageUsage.sessions.map((sessionUsage) => (
                          <tr key={sessionUsage.session.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-3 w-2/5">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-[#1dd1f5] rounded-full flex-shrink-0"></div>
                                {onSessionSwitch ? (
                                  <button
                                    onClick={() => handleSessionClick(sessionUsage.session.id)}
                                    className="text-sm font-medium text-[#1dd1f5] hover:text-[#014463] hover:underline truncate text-left touch-manipulation min-h-[44px] flex items-center"
                                    title={`Click to open "${sessionUsage.session.name}"`}
                                  >
                                    {sessionUsage.session.name}
                                  </button>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {sessionUsage.session.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 w-1/12">
                              {sessionUsage.session.nodes.length}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 w-1/4 hidden sm:table-cell">
                              {formatDate(sessionUsage.session.createdAt)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-900 w-1/12">
                              {formatBytes(sessionUsage.size)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 w-1/4">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
                                  <div 
                                    className={`h-2 rounded-full ${getProgressBarColor(sessionUsage.percentage)}`}
                                    style={{ width: `${Math.min(sessionUsage.percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                                  {sessionUsage.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Other Storage - Inline */}
                {storageUsage.other > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      <span>Other local storage</span>
                    </div>
                    <span>{formatBytes(storageUsage.other)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
                  <div className="text-xs sm:text-sm text-gray-500">
                    Data is stored locally in your browser
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    {storageUsage && storageUsage.sessions.some(s => s.session.nodes.length === 0) && (
                      <button
                        onClick={handleClearEmptySessions}
                        disabled={clearing}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                      >
                        {clearing ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            <span>Clearing...</span>
                          </div>
                        ) : (
                          'Clear Empty Sessions'
                        )}
                      </button>
                    )}
                    <button
                      onClick={loadStorageData}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-[#1dd1f5] transition-colors touch-manipulation min-h-[44px]"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-[#1dd1f5] border border-[#1dd1f5] rounded-md hover:bg-[#1bc4e8] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-[#1dd1f5] transition-colors touch-manipulation min-h-[44px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load storage data</h3>
                <p className="text-gray-500">There was an error loading the storage usage information.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
