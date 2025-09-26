'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateStorageUsage, formatBytes, getStorageQuota, clearEmptySessions, StorageUsage } from '../../features/session/services/storageUsage';
import { useSessionManager } from '../../features/session/hooks/useSessionManager';
import { AppHeader } from '../../features/session';

export default function UsagePage() {
  const router = useRouter();
  const { currentSession, sessions, switchSession, createNewSession, renameSession } = useSessionManager();
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [quota, setQuota] = useState<{ quota: number; usage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, []);

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
    switchSession(sessionId);
    router.push('/'); // Navigate back to main page after switching
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={createNewSession}
        onSessionSwitch={switchSession}
        onSessionRename={renameSession}
        showSessionSelector={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Storage Usage</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your local storage and sessions</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1dd1f5] border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading storage data...</span>
              </div>
            ) : storageUsage ? (
              <div className="space-y-6">
                {/* Total Usage */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Total Storage Used</h3>
                      {quota && quota.quota > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatBytes(quota.usage)} of {formatBytes(quota.quota)} available
                        </p>
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

                {/* Sessions Table */}
                <div className="w-full">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Sessions ({storageUsage.sessions.length})
                  </h3>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Nodes
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3 hidden sm:table-cell">
                            Created
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {storageUsage.sessions.map((sessionUsage) => (
                          <tr key={sessionUsage.session.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 w-2/5">
                              <button
                                onClick={() => handleSessionClick(sessionUsage.session.id)}
                                className="text-sm font-medium text-[#1dd1f5] hover:text-[#014463] hover:underline text-left truncate block w-full"
                                title={`Click to open "${sessionUsage.session.name}"`}
                              >
                                {sessionUsage.session.name}
                              </button>
                            </td>
                            <td className="px-3 py-3 w-1/6">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sessionUsage.session.nodes.length === 0 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {sessionUsage.session.nodes.length}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-500 w-1/3 hidden sm:table-cell">
                              {formatDate(sessionUsage.session.createdAt)}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900 w-1/6">
                              {formatBytes(sessionUsage.size)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Other Storage */}
                {storageUsage.other > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Other local storage</span>
                      <span className="text-sm text-gray-900">{formatBytes(storageUsage.other)}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  {storageUsage && storageUsage.sessions.some(s => s.session.nodes.length === 0) && (
                    <button
                      onClick={handleClearEmptySessions}
                      disabled={clearing}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearing ? 'Clearing...' : 'Clear Empty Sessions'}
                    </button>
                  )}
                  <button
                    onClick={loadStorageData}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5]"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load storage data</h3>
                <p className="text-gray-600">There was an error loading the storage usage information.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
