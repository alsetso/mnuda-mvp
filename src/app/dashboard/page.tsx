"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/features/workspaces';
import { PlusIcon, ArrowRightIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import PageLayout from '@/components/PageLayout';

export default function DashboardPage() {
  const { workspaces, loading } = useWorkspace();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading workspaces...</div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
          {/* Sleek Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your workspaces and data</p>
            </div>
            <Link
              href="/workspace/new"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Workspace</span>
            </Link>
          </div>

          {/* Workspaces Grid */}
          {workspaces.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
              <p className="text-gray-500 mb-6">Create your first workspace to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspace/${workspace.id}`}
                  className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{workspace.emoji || '🏢'}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {workspace.name}
                        </h3>
                        {workspace.description && (
                          <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>Team</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
    </PageLayout>
  );
}
