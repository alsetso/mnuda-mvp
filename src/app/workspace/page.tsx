"use client";

import React from 'react';
import { WorkspaceDashboard, WorkspaceStats } from '@/features/workspaces/components/WorkspaceDashboard';
import { WorkspaceSettings } from '@/features/workspaces/components/WorkspaceSettings';
import { useWorkspace } from '@/features/workspaces/contexts/WorkspaceContext';

export default function WorkspacePage() {
  const { currentWorkspace } = useWorkspace();

  return (
    <WorkspaceDashboard>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{currentWorkspace?.emoji || '🏢'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentWorkspace?.name || 'Workspace'}</h1>
              {currentWorkspace?.description && (
                <p className="text-gray-600">{currentWorkspace.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <WorkspaceStats />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/map"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🗺️</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Open Map</div>
                <div className="text-sm text-gray-500">Start searching addresses</div>
              </div>
            </a>
            
            <a
              href="/account"
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">👤</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Account</div>
                <div className="text-sm text-gray-500">Manage your profile</div>
              </div>
            </a>
            
            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Analytics</div>
                <div className="text-sm text-gray-500">View workspace stats</div>
              </div>
            </button>
          </div>
        </div>

        {/* Settings */}
        <WorkspaceSettings />
      </div>
    </WorkspaceDashboard>
  );
}
