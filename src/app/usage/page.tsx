'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateStorageUsage, formatBytes, getStorageQuota, clearEmptySessions, StorageUsage } from '../../features/session/services/storageUsage';
import { useSessionManager } from '../../features/session/hooks/useSessionManager';
import { AppHeader } from '../../features/session';
import { useAuth } from '../../features/auth';

type TabType = 'local' | 'cloud';

interface CloudStorageData {
  totalSessions: number;
  totalNodes: number;
  totalSize: number;
  lastSync: string | null;
  sessions: Array<{
    id: string;
    name: string;
    nodeCount: number;
    size: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function UsagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentSession, sessions, switchSession, createNewSession } = useSessionManager();
  const [activeTab, setActiveTab] = useState<TabType>('local');
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [quota, setQuota] = useState<{ quota: number; usage: number } | null>(null);
  const [cloudData, setCloudData] = useState<CloudStorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (activeTab === 'cloud' && user) {
      loadCloudData();
    }
  }, [activeTab, user]);

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

  const loadCloudData = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual Supabase cloud storage data fetching
      // For now, return empty cloud data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const emptyCloudData: CloudStorageData = {
        totalSessions: 0,
        totalNodes: 0,
        totalSize: 0,
        lastSync: null,
        sessions: [],
      };
      
      setCloudData(emptyCloudData);
    } catch (error) {
      console.error('Error loading cloud data:', error);
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

  // Simple storage comparison component
  const StorageComparison = () => {
    const localUsed = storageUsage?.total || 0;
    const cloudUsed = cloudData?.totalSize || 0;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage Usage</h3>
          <p className="text-sm text-gray-600">Local vs Cloud Storage</p>
        </div>
        
        {/* Simple comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Local Storage */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700 mb-1">
              {formatBytes(localUsed)}
            </div>
            <div className="text-sm text-green-600 font-medium">Local Storage</div>
            <div className="text-xs text-green-500 mt-1">
              {storageUsage?.sessions.length || 0} sessions
            </div>
          </div>

          {/* Cloud Storage */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {formatBytes(cloudUsed)}
            </div>
            <div className="text-sm text-blue-600 font-medium">Cloud Storage</div>
            <div className="text-xs text-blue-500 mt-1">
              {cloudData?.totalSessions || 0} sessions
            </div>
          </div>
        </div>
      </div>
    );
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
        showSessionSelector={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storage Comparison - Above Tabs */}
        {storageUsage && (
          <div className="mb-8">
            <StorageComparison />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Storage Usage</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your local and cloud storage</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('local')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'local'
                    ? 'border-[#1dd1f5] text-[#1dd1f5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span>Local Storage</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('cloud')}
                disabled={!user}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'cloud'
                    ? 'border-[#1dd1f5] text-[#1dd1f5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Cloud Storage</span>
                  {!user && <span className="text-xs text-gray-400">(Sign in required)</span>}
                </div>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1dd1f5] border-t-transparent"></div>
                <span className="ml-3 text-gray-600">
                  {activeTab === 'local' ? 'Loading local storage data...' : 'Loading cloud storage data...'}
                </span>
              </div>
            ) : activeTab === 'local' && storageUsage ? (
              <div className="space-y-6">

                {/* Total Usage Summary */}
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
            ) : activeTab === 'cloud' && cloudData ? (
              <div className="space-y-6">

                {/* Cloud Storage Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Cloud Storage Summary</h3>
                      <p className="text-xs text-blue-700 mt-1">
                        Last synced: {cloudData.lastSync ? new Date(cloudData.lastSync).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-900">
                        {formatBytes(cloudData.totalSize)}
                      </div>
                      <div className="text-xs text-blue-700">
                        {cloudData.totalSessions} sessions • {cloudData.totalNodes} nodes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cloud Sessions */}
                {cloudData.sessions.length > 0 ? (
                  <div className="w-full">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Cloud Sessions ({cloudData.sessions.length})
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
                              Updated
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                              Size
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cloudData.sessions.map((session) => (
                            <tr key={session.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3 w-2/5">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {session.name}
                                </div>
                              </td>
                              <td className="px-3 py-3 w-1/6">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {session.nodeCount}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-500 w-1/3 hidden sm:table-cell">
                                {new Date(session.updatedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-900 w-1/6">
                                {formatBytes(session.size)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cloud sessions</h3>
                    <p className="text-gray-600 mb-4">You haven&apos;t synced any sessions to the cloud yet.</p>
                    <button
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Sync Local Sessions
                    </button>
                  </div>
                )}

                {/* Cloud Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={loadCloudData}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5]"
                  >
                    Refresh Cloud Data
                  </button>
                  {cloudData.sessions.length > 0 && (
                    <button
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Sync to Local
                    </button>
                  )}
                </div>
              </div>
            ) : activeTab === 'cloud' && !user ? (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in required</h3>
                <p className="text-gray-600 mb-4">You need to be signed in to view your cloud storage.</p>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1dd1f5] rounded-md hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5]"
                >
                  Sign In
                </button>
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
