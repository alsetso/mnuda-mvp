'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateStorageUsage, formatBytes, getStorageQuota, clearEmptySessions, StorageUsage } from '../../features/session/services/storageUsage';
import { useSessionManager } from '../../features/session/hooks/useSessionManager';
import { AppHeader } from '../../features/session';
import { useAuth } from '../../features/auth';
import { useApiUsageContext } from '../../features/session/contexts/ApiUsageContext';
import { API_PRICING, apiUsageService } from '../../features/session/services/apiUsageService';

type TabType = 'local' | 'cloud' | 'credits';

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
  const { apiUsage } = useApiUsageContext();
  const [activeTab, setActiveTab] = useState<TabType>('credits');
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

  // const formatDate = (timestamp: number) => { // Unused
  //   return new Date(timestamp).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };

  // Simple storage comparison component - Unused
  // const StorageComparison = () => {
  //   const localUsed = storageUsage?.total || 0;
  //   const cloudUsed = cloudData?.totalSize || 0;

  //   return (
  //     <div className="bg-white border border-gray-200 rounded-lg p-6">
  //       <div className="text-center mb-6">
  //         <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage Usage</h3>
  //         <p className="text-sm text-gray-600">Local vs Cloud Storage</p>
  //       </div>
        
  //       {/* Simple comparison */}
  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //         {/* Local Storage */}
  //         <div className="bg-green-50 rounded-lg p-4 text-center">
  //           <div className="text-2xl font-bold text-green-700 mb-1">
  //             {formatBytes(localUsed)}
  //           </div>
  //           <div className="text-sm text-green-600 font-medium">Local Storage</div>
  //           <div className="text-xs text-green-500 mt-1">
  //             {storageUsage?.sessions.length || 0} sessions
  //           </div>
  //         </div>

  //         {/* Cloud Storage */}
  //         <div className="bg-blue-50 rounded-lg p-4 text-center">
  //           <div className="text-2xl font-bold text-blue-700 mb-1">
  //             {formatBytes(cloudUsed)}
  //           </div>
  //           <div className="text-sm text-blue-600 font-medium">Cloud Storage</div>
  //           <div className="text-xs text-blue-500 mt-1">
  //             {cloudData?.totalSessions || 0} sessions
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

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

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* API Pricing */}
        <div className="mb-4">
          <div className="bg-white border rounded p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">API Pricing</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {Object.entries(API_PRICING).map(([type, cost]) => (
                <div key={type} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-600 capitalize">{type.replace('-', ' ')}</span>
                  <span className="font-mono text-[#014463] font-medium">${cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Storage Comparison */}
        {storageUsage && (
          <div className="mb-4">
            <div className="bg-white border rounded p-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-mono text-gray-700">Local: {formatBytes(storageUsage.total)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-mono text-gray-700">Cloud: {formatBytes(cloudData?.totalSize || 0)}</span>
                  </div>
                </div>
                <div className="text-gray-500">
                  {storageUsage.sessions.length} sessions • {cloudData?.totalSessions || 0} cloud
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border rounded">
          {/* Compact Header */}
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-medium text-gray-900">Usage Dashboard</h1>
              <div className="text-xs text-gray-500">API Credits & Storage</div>
            </div>
          </div>

          {/* Compact Tabs */}
          <div className="border-b">
            <nav className="flex px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('credits')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'credits'
                    ? 'border-[#1dd1f5] text-[#1dd1f5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'local'
                    ? 'border-[#1dd1f5] text-[#1dd1f5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Local
              </button>
              <button
                onClick={() => setActiveTab('cloud')}
                disabled={!user}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'cloud'
                    ? 'border-[#1dd1f5] text-[#1dd1f5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cloud {!user && '(Sign in)'}
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1dd1f5] border-t-transparent"></div>
                <span className="ml-3 text-gray-600">
                  {activeTab === 'credits' ? 'Loading credit usage data...' : 
                   activeTab === 'local' ? 'Loading local storage data...' : 'Loading cloud storage data...'}
                </span>
              </div>
            ) : activeTab === 'credits' ? (
              <div className="space-y-4">
                {/* Compact Credit Summary */}
                <div className="bg-gray-50 rounded border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm text-gray-600">Balance</div>
                        <div className="text-xl font-mono text-[#014463]">
                          {apiUsage?.hasUnlimitedCredits ? '∞' : apiUsageService.formatCreditsWithDollar(apiUsage?.creditsRemaining || 0)}
                        </div>
                      </div>
                      {!apiUsage?.hasUnlimitedCredits && (
                        <div>
                          <div className="text-sm text-gray-600">Used</div>
                          <div className="text-sm font-mono text-gray-800">
                            {apiUsageService.formatCreditsWithDollar(apiUsage?.creditsUsed || 0)} / {apiUsageService.formatCreditsWithDollar(apiUsage?.totalCredits || 0)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">API Pricing</div>
                      <div className="text-xs font-mono text-gray-700">
                        {Object.entries(API_PRICING).map(([type, cost]) => (
                          <span key={type} className="mr-2">
                            {type}: ${cost.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {!apiUsage?.hasUnlimitedCredits && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded h-1">
                        <div 
                          className="bg-[#1dd1f5] h-1 rounded transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((apiUsage?.creditsUsed || 0) / (apiUsage?.totalCredits || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Usage History */}
                {apiUsage?.apiUsageHistory && apiUsage.apiUsageHistory.length > 0 ? (
                  <div className="bg-white border rounded">
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-700">
                      API Usage History ({apiUsage.apiUsageHistory.length} calls)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">API</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Cost</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {apiUsage.apiUsageHistory.slice(-20).reverse().map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono text-gray-900">
                                {record.apiType}
                              </td>
                              <td className="px-3 py-2 font-mono text-[#014463]">
                                ${record.cost.toFixed(2)}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  record.success 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {record.success ? '✓' : '✗'}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-gray-500">
                                {new Date(record.timestamp).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border rounded p-6 text-center">
                    <div className="text-sm text-gray-500">No API calls recorded</div>
                  </div>
                )}

                {/* Compact Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                  >
                    Refresh
                  </button>
                  {!apiUsage?.hasUnlimitedCredits && (
                    <button
                      onClick={() => router.push('/signup')}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#1dd1f5] border border-transparent rounded hover:bg-[#014463] focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                    >
                      Get More
                    </button>
                  )}
                </div>
              </div>
            ) : activeTab === 'local' && storageUsage ? (
              <div className="space-y-3">
                {/* Compact Storage Summary */}
                <div className="bg-gray-50 rounded p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="font-mono text-gray-900 ml-1">{formatBytes(storageUsage.total)}</span>
                      </div>
                      {quota && quota.quota > 0 && (
                        <div>
                          <span className="text-gray-600">Quota:</span>
                          <span className="font-mono text-gray-900 ml-1">
                            {((quota.usage / quota.quota) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {storageUsage.sessions.length} sessions
                    </div>
                  </div>
                </div>

                {/* Compact Sessions Table */}
                <div className="bg-white border rounded">
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-700">
                    Local Sessions ({storageUsage.sessions.length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Nodes</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Created</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {storageUsage.sessions.map((sessionUsage) => (
                          <tr key={sessionUsage.session.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleSessionClick(sessionUsage.session.id)}
                                className="text-[#1dd1f5] hover:text-[#014463] hover:underline text-left truncate block w-full"
                                title={`Click to open "${sessionUsage.session.name}"`}
                              >
                                {sessionUsage.session.name}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                sessionUsage.session.nodes.length === 0 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {sessionUsage.session.nodes.length}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-500 hidden sm:table-cell">
                              {new Date(sessionUsage.session.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-900">
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
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Other local storage</span>
                      <span className="font-mono text-gray-900">{formatBytes(storageUsage.other)}</span>
                    </div>
                  </div>
                )}

                {/* Compact Actions */}
                <div className="flex gap-2">
                  {storageUsage && storageUsage.sessions.some(s => s.session.nodes.length === 0) && (
                    <button
                      onClick={handleClearEmptySessions}
                      disabled={clearing}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearing ? 'Clearing...' : 'Clear Empty'}
                    </button>
                  )}
                  <button
                    onClick={loadStorageData}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : activeTab === 'cloud' && cloudData ? (
              <div className="space-y-3">
                {/* Compact Cloud Summary */}
                <div className="bg-blue-50 rounded p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-blue-700">Cloud:</span>
                        <span className="font-mono text-blue-900 ml-1">{formatBytes(cloudData.totalSize)}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Sessions:</span>
                        <span className="font-mono text-blue-900 ml-1">{cloudData.totalSessions}</span>
                      </div>
                    </div>
                    <div className="text-blue-600">
                      {cloudData.lastSync ? new Date(cloudData.lastSync).toLocaleDateString() : 'Never synced'}
                    </div>
                  </div>
                </div>

                {/* Cloud Sessions */}
                {cloudData.sessions.length > 0 ? (
                  <div className="bg-white border rounded">
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-700">
                      Cloud Sessions ({cloudData.sessions.length})
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Nodes</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Updated</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Size</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cloudData.sessions.map((session) => (
                            <tr key={session.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900 truncate">
                                {session.name}
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  {session.nodeCount}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-gray-500 hidden sm:table-cell">
                                {new Date(session.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 font-mono text-gray-900">
                                {formatBytes(session.size)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border rounded p-6 text-center">
                    <div className="text-sm text-gray-500 mb-2">No cloud sessions</div>
                    <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      Sync Local Sessions
                    </button>
                  </div>
                )}

                {/* Compact Cloud Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={loadCloudData}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                  >
                    Refresh
                  </button>
                  {cloudData.sessions.length > 0 && (
                    <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      Sync to Local
                    </button>
                  )}
                </div>
              </div>
            ) : activeTab === 'cloud' && !user ? (
              <div className="bg-white border rounded p-6 text-center">
                <div className="text-sm text-gray-500 mb-2">Sign in required for cloud storage</div>
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#1dd1f5] rounded hover:bg-[#014463] focus:outline-none focus:ring-1 focus:ring-[#1dd1f5]"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="bg-white border rounded p-6 text-center">
                <div className="text-sm text-gray-500">Unable to load storage data</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
