'use client';

import { useState, useEffect } from 'react';
import { calculateStorageUsage, formatBytes, getStorageQuota, clearEmptySessions, StorageUsage } from '../services/storageUsage';

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
    if (percentage >= 80) return 'from-red-400 to-red-600';
    if (percentage >= 60) return 'from-amber-400 to-amber-600';
    return 'from-cyan-400 to-blue-500';
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Enhanced Backdrop with blur */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
          {/* Enhanced Header with gradient */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
            <div className="flex items-center justify-between p-6 sm:p-8">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 truncate">Storage Usage</h2>
                  <p className="text-sm text-slate-600 truncate mt-1">Local storage usage breakdown and management</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-gradient-to-br from-slate-50/30 to-white">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200"></div>
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <span className="text-lg font-medium text-slate-700">Loading storage data...</span>
                </div>
              </div>
            ) : storageUsage ? (
              <div className="space-y-8">
                {/* Enhanced Total Usage Summary */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-lg border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">Total Usage</h3>
                        {quota && quota.quota > 0 && (
                          <p className="text-sm text-slate-500 mt-1">
                            {formatBytes(quota.usage)} of {formatBytes(quota.quota)} used
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        {formatBytes(storageUsage.total)}
                      </div>
                      {quota && quota.quota > 0 && (
                        <div className="text-sm text-slate-500 mt-1">
                          {((quota.usage / quota.quota) * 100).toFixed(1)}% of quota
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Sessions Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
                    <h3 className="text-xl font-semibold text-slate-900">Sessions</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {storageUsage.sessions.length} session{storageUsage.sessions.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-slate-200 min-w-[700px]">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-2/5">
                            Session Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/12">
                            Nodes
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/4 hidden sm:table-cell">
                            Created
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/12">
                            Size
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/4">
                            Usage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {storageUsage.sessions.map((sessionUsage) => (
                          <tr key={sessionUsage.session.id} className="hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-cyan-50/30 transition-all duration-200">
                            <td className="px-6 py-4 w-2/5">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex-shrink-0 shadow-sm"></div>
                                {onSessionSwitch ? (
                                  <button
                                    onClick={() => handleSessionClick(sessionUsage.session.id)}
                                    className="text-sm font-semibold text-cyan-600 hover:text-cyan-800 hover:underline truncate text-left touch-manipulation min-h-[44px] flex items-center transition-colors duration-200"
                                    title={`Click to open "${sessionUsage.session.name}"`}
                                  >
                                    {sessionUsage.session.name}
                                  </button>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-900 truncate">
                                    {sessionUsage.session.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm w-1/12">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                sessionUsage.session.nodes.length === 0 
                                  ? 'bg-slate-100 text-slate-600' 
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {sessionUsage.session.nodes.length}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 w-1/4 hidden sm:table-cell">
                              {formatDate(sessionUsage.session.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900 w-1/12">
                              {formatBytes(sessionUsage.size)}
                            </td>
                            <td className="px-6 py-4 w-1/4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-slate-200 rounded-full h-2.5 min-w-16 shadow-inner">
                                  <div 
                                    className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressBarColor(sessionUsage.percentage)} shadow-sm transition-all duration-300`}
                                    style={{ width: `${Math.min(sessionUsage.percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-slate-600 w-12 text-right flex-shrink-0">
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

                {/* Enhanced Other Storage */}
                {storageUsage.other > 0 && (
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-200 rounded-lg">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-700">Other local storage</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatBytes(storageUsage.other)}</span>
                    </div>
                  </div>
                )}

                {/* Enhanced Actions */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/60">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm text-slate-600 font-medium">
                        Data is stored locally in your browser
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      {storageUsage && storageUsage.sessions.some(s => s.session.nodes.length === 0) && (
                        <button
                          onClick={handleClearEmptySessions}
                          disabled={clearing}
                          className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-red-700 bg-white border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] shadow-sm"
                        >
                          {clearing ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              <span>Clearing...</span>
                            </div>
                          ) : (
                            'Clear Empty Sessions'
                          )}
                        </button>
                      )}
                      <button
                        onClick={loadStorageData}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all duration-200 touch-manipulation min-h-[48px] shadow-sm"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 border-2 border-transparent rounded-xl hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-all duration-200 touch-manipulation min-h-[48px] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Unable to load storage data</h3>
                <p className="text-slate-600 max-w-md mx-auto">There was an error loading the storage usage information. Please try refreshing the page.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}