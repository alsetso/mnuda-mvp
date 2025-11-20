'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { CreditRestorationTimeline } from './CreditRestorationTimeline';
import { NegativeItemsPanel } from './NegativeItemsPanel';
import { CreditRestorationService } from '../services/creditRestorationService';
import type { NegativeItem } from '../types';

interface CreditRestorationDashboardProps {
  requests: any[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
  onRefresh: () => void;
}

export function CreditRestorationDashboard({
  requests,
  selectedRequestId,
  onSelectRequest,
  onRefresh,
}: CreditRestorationDashboardProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [negativeItems, setNegativeItems] = useState<NegativeItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [activeView, setActiveView] = useState<'timeline' | 'items'>('timeline');

  useEffect(() => {
    if (selectedRequestId) {
      const request = requests.find(r => r.id === selectedRequestId);
      setSelectedRequest(request || null);
      if (request) {
        loadNegativeItems(request.id);
      }
    }
  }, [selectedRequestId, requests]);

  const loadNegativeItems = async (requestId: string) => {
    setIsLoadingItems(true);
    try {
      const items = await CreditRestorationService.getNegativeItems(requestId);
      setNegativeItems(items);
    } catch (error) {
      console.error('Error loading negative items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const selectedRequestData = selectedRequest || requests[0];

  if (!selectedRequestData) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Request List */}
      <div className="w-80 bg-white border-r-2 border-gray-200 flex flex-col">
        <div className="p-4 border-b-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Credit Restoration</h2>
            <button
              onClick={() => router.push('/account/credit')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="New request"
            >
              <PlusIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-2 space-y-2">
            {requests.map((request) => {
              const isSelected = request.id === selectedRequestId;
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                in_progress: 'bg-blue-100 text-blue-800',
                completed: 'bg-green-100 text-green-800',
                cancelled: 'bg-gray-100 text-gray-800',
              };

              return (
                <button
                  key={request.id}
                  onClick={() => onSelectRequest(request.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-black text-sm">
                      Request #{request.id.slice(0, 8)}
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[request.status as keyof typeof statusColors] || statusColors.pending
                      }`}
                    >
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">
                Credit Restoration Request
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Submitted {new Date(selectedRequestData.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('timeline')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeView === 'timeline'
                    ? 'bg-gold-500 text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveView('items')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeView === 'items'
                    ? 'bg-gold-500 text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Negative Items ({negativeItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {activeView === 'timeline' ? (
            <CreditRestorationTimeline
              request={selectedRequestData}
              negativeItems={negativeItems}
              isLoadingItems={isLoadingItems}
            />
          ) : (
            <NegativeItemsPanel
              items={negativeItems}
              isLoading={isLoadingItems}
              onRefresh={() => selectedRequestData && loadNegativeItems(selectedRequestData.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

