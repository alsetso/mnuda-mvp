import { Suspense } from 'react';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminCommunityFeedService } from '@/features/admin/services/communityFeedAdminService';
import PageLayout from '@/components/PageLayout';
import { PageSuspense } from '@/components/SuspenseBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';
import { formatDistanceToNow } from 'date-fns';
import { DeleteMessageButton } from './DeleteMessageButton';

export const metadata: Metadata = {
  title: 'Admin Community Feed | MNUDA',
  description: 'Moderate community feed messages.',
  robots: 'noindex, nofollow',
};

export default async function AdminCommunityFeedPage() {
  const auth = await requireAdminAccess();

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
      serverAuth={auth}
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
                  Community Feed
                </h1>
                <p className="text-gray-600 text-lg">
                  Moderate community feed messages
                </p>
              </div>
              <Link
                href="/admin"
                className="text-gold-600 hover:text-gold-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <Suspense fallback={<div className="mb-8">Loading statistics...</div>}>
            <FeedStats />
          </Suspense>

          {/* Messages List */}
          <Suspense fallback={<PageLoadingSkeleton />}>
            <MessagesList />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

async function FeedStats() {
  const service = new AdminCommunityFeedService();
  const stats = await service.getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total Messages</div>
        <div className="text-3xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Today</div>
        <div className="text-3xl font-bold text-green-600">{stats.today}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">This Week</div>
        <div className="text-3xl font-bold text-blue-600">{stats.thisWeek}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">This Month</div>
        <div className="text-3xl font-bold text-purple-600">{stats.thisMonth}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Unique Users</div>
        <div className="text-3xl font-bold text-gold-600">{stats.uniqueUsers}</div>
      </div>
    </div>
  );
}

async function MessagesList() {
  const service = new AdminCommunityFeedService();
  const messages = await service.getAllWithDetails(200);

  return (
    <>
      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                  {message.member?.avatar_url ? (
                    <img
                      src={message.member.avatar_url}
                      alt={message.member.name || 'User'}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-gold-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-black">
                          {message.member?.name || message.member?.email?.split('@')[0] || 'Anonymous'}
                        </span>
                        {message.member?.email && (
                          <span className="text-sm text-gray-500">
                            ({message.member.email})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <DeleteMessageButton messageId={message.id} />
                    </div>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap break-words">
                    {message.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
          <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No messages found</p>
        </div>
      )}
    </>
  );
}

