"use client";

import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { WorkspaceSelector, WorkspaceBreadcrumb } from './WorkspaceSelector';
import { Cog6ToothIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import PageLayout from '@/components/PageLayout';

interface WorkspaceDashboardProps {
  children: React.ReactNode;
}

export function WorkspaceDashboard({ children }: WorkspaceDashboardProps) {
  const { currentWorkspace, loading, error } = useWorkspace();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Workspace</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Workspace Selected</h2>
          <p className="text-gray-600 mb-6">
            Select a workspace from the dropdown above to get started, or create a new one.
          </p>
          <WorkspaceSelector />
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      {/* Custom Workspace Header Bar - Additional navigation for workspace pages */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left side - Workspace Selector */}
            <div className="flex items-center space-x-4">
              <div className="h-6 w-px bg-gray-200"></div>
              <WorkspaceSelector />
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-4">
              <WorkspaceBreadcrumb />
              <div className="h-6 w-px bg-gray-200"></div>
              <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors" title="Members">
                <UsersIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors" title="Analytics">
                <ChartBarIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors" title="Settings">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </PageLayout>
  );
}

export function WorkspaceStats() {
  const { currentWorkspace, members } = useWorkspace();

  if (!currentWorkspace) return null;

  const stats = [
    {
      name: 'Members',
      value: members.length,
      icon: UsersIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Created',
      value: new Date(currentWorkspace.created_at).toLocaleDateString(),
      icon: ChartBarIcon,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
