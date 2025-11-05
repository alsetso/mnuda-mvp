'use client';

import Link from 'next/link';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import CommunitySidebar from '@/features/community/components/CommunitySidebar';

interface WorkspaceWithCounts {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  memberCount: number;
  propertyCount: number;
}

interface SecondarySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  workspaces: WorkspaceWithCounts[];
  isLoading?: boolean;
}

export default function SecondarySidebar({
  isOpen,
  onToggle,
  workspaces,
  isLoading = false,
}: SecondarySidebarProps) {
  return (
    <>
      {/* Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex flex-shrink-0 w-8 bg-gold-200 border-r border-gold-300 hover:bg-gold-300 transition-colors items-center justify-center group"
          title="Open sidebar"
        >
          <ChevronRightIcon className="w-4 h-4 text-black group-hover:text-black" />
        </button>
      )}

      {/* Sidebar Content */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />

          <aside className="fixed md:static inset-y-0 left-16 md:left-0 z-50 md:z-auto w-64 bg-white border-r border-gold-200 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 h-12 border-b border-gold-200 flex items-center justify-between px-4">
              <h2 className="text-sm font-black text-black">Workspaces</h2>
              <div className="flex items-center gap-1">
                <Link
                  href="/workspace/new"
                  className="p-1.5 hover:bg-gold-50 rounded-lg transition-colors"
                  title="Create workspace"
                >
                  <PlusIcon className="w-4 h-4 text-gray-600" />
                </Link>
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-gold-50 rounded-lg transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-3">
                <CommunitySidebar workspaces={workspaces} isLoading={isLoading} />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

