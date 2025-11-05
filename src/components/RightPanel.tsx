'use client';

import {
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import NewsSidebar from '@/features/community/components/NewsSidebar';

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function RightPanel({ isOpen, onToggle }: RightPanelProps) {
  return (
    <>
      {/* Sidebar Content */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />

          <aside className="fixed md:static inset-y-0 right-0 z-50 md:z-auto w-72 bg-white border-l border-gold-200 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 h-12 border-b border-gold-200 flex items-center justify-between px-4">
              <h2 className="text-sm font-black text-black">News & Updates</h2>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-gold-50 rounded-lg transition-colors"
                title="Collapse panel"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-3">
                <NewsSidebar />
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden lg:flex flex-shrink-0 w-8 bg-gold-200 border-l border-gold-300 hover:bg-gold-300 transition-colors items-center justify-center group"
          title="Open panel"
        >
          <ChevronLeftIcon className="w-4 h-4 text-black group-hover:text-black" />
        </button>
      )}
    </>
  );
}

