"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Workspace as CtxWorkspace } from '../contexts/WorkspaceContext';
import type { Workspace as ApiWorkspace } from '@/types/workspace';

export function WorkspaceSelector() {
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    loading
  } = useWorkspace();

  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if we're on a workspace page
  const isWorkspacePage = pathname.startsWith('/workspace/');

  const handleWorkspaceSelect = (workspace: CtxWorkspace | ApiWorkspace) => {
    const normalized: CtxWorkspace = {
      id: workspace.id,
      name: workspace.name,
      emoji: (workspace as Partial<CtxWorkspace>).emoji,
      description: workspace.description,
      created_by: (workspace as Partial<CtxWorkspace>).created_by || (workspace as Partial<ApiWorkspace>).owner_id || '',
      created_at: workspace.created_at,
    };
    setCurrentWorkspace(normalized);
    setIsOpen(false);
    // Navigate to the workspace page
    router.push(`/workspace/${workspace.id}`);
  };

  const handleBackToDashboard = () => {
    setIsOpen(false);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-2 py-1.5 animate-pulse">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="w-20 h-3 bg-gray-200 rounded"></div>
        <div className="w-3 h-3 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Compact Workspace Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors min-w-0 rounded"
      >
        <span className="text-base flex-shrink-0">
          {currentWorkspace?.emoji || '🏢'}
        </span>
        <span className="font-medium text-gray-900 truncate max-w-24">
          {currentWorkspace?.name || 'Select'}
        </span>
        <ChevronDownIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {/* Back to Dashboard Button - Show only on workspace pages */}
            {isWorkspacePage && (
              <button
                onClick={handleBackToDashboard}
                className="w-full flex items-center justify-center px-2 py-1.5 text-gray-700 hover:text-[#014463] hover:bg-gray-50 rounded transition-colors mb-2"
                title="Back to Dashboard"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            
            <div className="text-xs font-medium text-gray-500 mb-2 px-1">Workspaces</div>
            
            {/* Workspace List */}
            <div className="space-y-1">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors ${
                    currentWorkspace?.id === workspace.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-sm">{workspace.emoji || '🏢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{workspace.name}</div>
                  </div>
                  {currentWorkspace?.id === workspace.id && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function WorkspaceBreadcrumb() {
  const { currentWorkspace } = useWorkspace();

  if (!currentWorkspace) return null;

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      <span>{currentWorkspace.emoji || '🏢'}</span>
      <span>{currentWorkspace.name}</span>
    </div>
  );
}
