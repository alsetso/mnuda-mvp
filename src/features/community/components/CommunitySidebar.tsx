'use client';

import Link from 'next/link';
import { PlusIcon, ArrowRightIcon, UsersIcon, HomeModernIcon } from '@heroicons/react/24/outline';

interface WorkspaceWithCounts {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  memberCount: number;
  propertyCount: number;
}

interface CommunitySidebarProps {
  workspaces: WorkspaceWithCounts[];
  isLoading?: boolean;
}

export default function CommunitySidebar({ workspaces, isLoading }: CommunitySidebarProps) {
  return (
    <div className="space-y-6">
      {/* Workspaces Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-black">My Workspaces</h2>
          <Link
            href="/workspace/new"
            className="p-1.5 hover:bg-gold-50 rounded-lg transition-colors"
            title="Create workspace"
          >
            <PlusIcon className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
        
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="bg-gold-100 border border-gold-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">No workspaces yet</p>
              <Link
                href="/workspace/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create One
              </Link>
            </div>
          ) : (
            workspaces.slice(0, 5).map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.id}`}
                className="group block bg-white border border-gold-200 rounded-lg p-3 hover:border-black hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{workspace.emoji || '🏢'}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-black text-sm truncate">{workspace.name}</h3>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>{workspace.memberCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HomeModernIcon className="w-3.5 h-3.5" />
                    <span>{workspace.propertyCount}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {workspaces.length > 5 && (
          <Link
            href="/workspace"
            className="mt-3 block text-center text-sm font-semibold text-gray-600 hover:text-black transition-colors"
          >
            View all workspaces →
          </Link>
        )}
      </div>

      {/* Community Stats */}
      <div className="bg-gold-100 border border-gold-200 rounded-xl p-4">
        <h3 className="text-sm font-black text-black mb-3">Community</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Members</span>
            <span className="font-bold text-black">2.4K</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Properties</span>
            <span className="font-bold text-black">12.8K</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Workspaces</span>
            <span className="font-bold text-black">456</span>
          </div>
        </div>
      </div>
    </div>
  );
}

