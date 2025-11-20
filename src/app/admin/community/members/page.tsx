import { Suspense } from 'react';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminMemberService } from '@/features/admin/services/memberAdminService';
import PageLayout from '@/components/PageLayout';
import { PageSuspense } from '@/components/SuspenseBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { UserIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Accounts | MNUDA',
  description: 'Manage accounts and view statistics.',
  robots: 'noindex, nofollow',
};

export default async function AdminMembersPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Accounts
            </h1>
            <p className="text-gray-600 text-lg">
              Manage all accounts and view statistics
            </p>
          </div>

          {/* Statistics */}
          <Suspense fallback={<div className="mb-8">Loading statistics...</div>}>
            <MemberStats />
          </Suspense>

          {/* Members List */}
          <Suspense fallback={<PageLoadingSkeleton />}>
            <MembersList />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

async function MemberStats() {
  const service = new AdminMemberService();
  const stats = await service.getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Total Accounts</div>
        <div className="text-3xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Admins</div>
        <div className="text-3xl font-bold text-red-600">{stats.byRole.admin || 0}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Active (30 days)</div>
        <div className="text-3xl font-bold text-green-600">{stats.active}</div>
      </div>
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-1">Recent (7 days)</div>
        <div className="text-3xl font-bold text-gold-600">{stats.recent}</div>
      </div>
    </div>
  );
}

async function MembersList() {
  const service = new AdminMemberService();
  const members = await service.getAllMembers();

  return (
    <>
      {members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/admin/community/members/${member.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : 'Account'}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-gold-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-black mb-1">
                        {member.first_name || member.last_name
                          ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                          : 'Account'}
                      </h2>
                      <p className="text-gray-600 text-sm mb-1">
                        ID: {member.id}
                      </p>
                      {(member.first_name || member.last_name) && (
                        <p className="text-gray-500 text-sm">
                          {member.gender && `${member.gender}`}
                          {member.age && ` • Age ${member.age}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'admin' && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                          <ShieldCheckIcon className="w-4 h-4" />
                          Admin
                        </span>
                      )}
                      {member.role === 'general' && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          General
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        Created {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {member.last_visit && (
                      <div className="flex items-center gap-1">
                        <span>
                          Last visit {new Date(member.last_visit).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            No accounts found.
          </p>
        </div>
      )}
    </>
  );
}

