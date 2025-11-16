'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { NegativeItem } from '../types';

interface CreditRestorationTimelineProps {
  request: any;
  negativeItems: NegativeItem[];
  isLoadingItems: boolean;
}

interface TimelineEvent {
  id: string;
  type: 'system' | 'status' | 'parsing' | 'item';
  timestamp: string;
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: 'success' | 'pending' | 'error' | 'info';
  data?: any;
}

export function CreditRestorationTimeline({
  request,
  negativeItems,
  isLoadingItems,
}: CreditRestorationTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateTimelineEvents();
  }, [request, negativeItems, isLoadingItems]);

  useEffect(() => {
    scrollToBottom();
  }, [events]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateTimelineEvents = () => {
    const newEvents: TimelineEvent[] = [];

    // Initial submission
    newEvents.push({
      id: 'submission',
      type: 'system',
      timestamp: request.created_at,
      title: 'Request Submitted',
      message: 'Your credit restoration request has been received. We\'re processing your reports now.',
      icon: CheckCircleIcon,
      status: 'success',
    });

    // Parsing status for each bureau
    const bureaus = [
      { name: 'Experian', url: request.experian_report_url },
      { name: 'Equifax', url: request.equifax_report_url },
      { name: 'TransUnion', url: request.transunion_report_url },
    ];

    bureaus.forEach((bureau) => {
      if (bureau.url) {
        const bureauItems = negativeItems.filter(item => 
          item.bureau === bureau.name.toLowerCase()
        );

        if (bureauItems.length > 0) {
          newEvents.push({
            id: `parsing-${bureau.name.toLowerCase()}`,
            type: 'parsing',
            timestamp: new Date().toISOString(),
            title: `${bureau.name} Report Parsed`,
            message: `Found ${bureauItems.length} negative item${bureauItems.length !== 1 ? 's' : ''} in your ${bureau.name} report.`,
            icon: DocumentTextIcon,
            status: 'success',
            data: { bureau: bureau.name, count: bureauItems.length },
          });
        } else if (!isLoadingItems) {
          newEvents.push({
            id: `parsing-${bureau.name.toLowerCase()}-pending`,
            type: 'parsing',
            timestamp: new Date().toISOString(),
            title: `Parsing ${bureau.name} Report`,
            message: `Analyzing your ${bureau.name} credit report for negative items...`,
            icon: ClockIcon,
            status: 'pending',
          });
        }
      }
    });

    // Overall status
    if (negativeItems.length > 0) {
      newEvents.push({
        id: 'analysis-complete',
        type: 'status',
        timestamp: new Date().toISOString(),
        title: 'Analysis Complete',
        message: `We've identified ${negativeItems.length} negative item${negativeItems.length !== 1 ? 's' : ''} across all three credit reports. Our team is now preparing your dispute strategy.`,
        icon: CheckCircleIcon,
        status: 'success',
      });

      // Breakdown by type
      const itemsByType = negativeItems.reduce((acc, item) => {
        acc[item.itemType] = (acc[item.itemType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topTypes = Object.entries(itemsByType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      if (topTypes.length > 0) {
        newEvents.push({
          id: 'breakdown',
          type: 'item',
          timestamp: new Date().toISOString(),
          title: 'Item Breakdown',
          message: `Most common issues: ${topTypes.map(([type, count]) => `${type.replace(/_/g, ' ')} (${count})`).join(', ')}`,
          icon: DocumentTextIcon,
          status: 'info',
        });
      }
    }

    // Request status updates
    if (request.status === 'in_progress') {
      newEvents.push({
        id: 'in-progress',
        type: 'status',
        timestamp: request.updated_at || request.created_at,
        title: 'Restoration In Progress',
        message: 'Our team is actively working on your credit restoration. We\'ll update you as we make progress.',
        icon: ClockIcon,
        status: 'pending',
      });
    } else if (request.status === 'completed') {
      newEvents.push({
        id: 'completed',
        type: 'status',
        timestamp: request.updated_at || request.created_at,
        title: 'Restoration Completed',
        message: 'Your credit restoration process has been completed. Check your updated credit reports to see the improvements.',
        icon: CheckCircleIcon,
        status: 'success',
      });
    }

    // Sort by timestamp
    newEvents.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setEvents(newEvents);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <div
              key={event.id}
              className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${getStatusColor(event.status)}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-black">{event.title}</h3>
                    <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{event.message}</p>
                  
                  {event.data && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {event.data.bureau && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Bureau:</span> {event.data.bureau}
                        </p>
                      )}
                      {event.data.count !== undefined && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Items Found:</span> {event.data.count}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoadingItems && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-yellow-200 bg-yellow-50">
              <ClockIcon className="w-5 h-5 text-yellow-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-sm text-gray-600 ml-2">Analyzing credit reports...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (for future chat functionality) */}
      <div className="border-t-2 border-gray-200 p-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span>Updates will appear here as we process your request</span>
          </div>
        </div>
      </div>
    </div>
  );
}

