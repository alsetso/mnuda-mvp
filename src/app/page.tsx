'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { useWorkspace } from '@/features/workspaces';
import { PlusIcon, ArrowRightIcon, UsersIcon, HomeModernIcon } from '@heroicons/react/24/outline';
import PageLayout from '@/components/PageLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface WorkspaceWithCounts {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  created_at: string;
  memberCount: number;
  propertyCount: number;
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { workspaces, loading: workspacesLoading } = useWorkspace();
  const [workspacesWithCounts, setWorkspacesWithCounts] = useState<WorkspaceWithCounts[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Fetch counts for all workspaces
  useEffect(() => {
    const fetchCounts = async () => {
      if (!workspaces.length) {
        setWorkspacesWithCounts([]);
        return;
      }

      setLoadingCounts(true);
      try {
        const workspacesWithCountsData = await Promise.all(
          workspaces.map(async (workspace) => {
            // Get member count - fetch data instead of just count to work with RLS
            const { data: members, error: memberError } = await supabase
              .from('workspace_members')
              .select('id')
              .eq('workspace_id', workspace.id);

            if (memberError) {
              console.error('Error fetching members for workspace:', workspace.id, memberError);
            }

            // Get property count
            const { count: propertyCount, error: propertyError } = await supabase
              .from('properties')
              .select('*', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id);

            if (propertyError) {
              console.error('Error fetching properties count for workspace:', workspace.id, propertyError);
            }

            return {
              id: workspace.id,
              name: workspace.name,
              description: workspace.description,
              emoji: workspace.emoji,
              created_at: workspace.created_at,
              memberCount: members?.length || 0,
              propertyCount: propertyCount || 0,
            };
          })
        );

        setWorkspacesWithCounts(workspacesWithCountsData);
      } catch (error) {
        console.error('Error fetching workspace counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    if (user && workspaces.length > 0) {
      fetchCounts();
    }
  }, [workspaces, user]);

  // Show loading state while checking auth
  if (authLoading || (user && workspacesLoading)) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#014463] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If user is logged in, show workspaces dashboard
  if (user) {
    return (
      <PageLayout>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Workspaces</h1>
            <p className="text-sm text-gray-500 mt-0.5">Select a workspace to view properties and data</p>
          </div>
          <Link
            href="/workspace/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#014463] text-white text-sm rounded-lg font-medium hover:bg-[#013347] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New</span>
          </Link>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-3">🏢</div>
            <h3 className="text-base font-medium text-gray-900 mb-1">No workspaces yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first workspace to get started</p>
            <Link
              href="/workspace/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#014463] text-white text-sm rounded-lg font-medium hover:bg-[#013347] transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Workspace</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspacesWithCounts.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.id}`}
                className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-[#014463] hover:shadow-sm transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl flex-shrink-0">{workspace.emoji || '🏢'}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-[#014463] transition-colors truncate text-sm">
                        {workspace.name}
                      </h3>
                      {workspace.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{workspace.description}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-[#014463] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{loadingCounts ? '...' : workspace.memberCount}</span>
                    <span className="text-gray-500">member{workspace.memberCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HomeModernIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{loadingCounts ? '...' : workspace.propertyCount}</span>
                    <span className="text-gray-500">propert{workspace.propertyCount !== 1 ? 'ies' : 'y'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageLayout>
    );
  }

  // If user is not logged in, show landing page
  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="7xl" backgroundColor="bg-white" contentPadding="px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-[#0144630F] to-white">
        <div className="absolute inset-0 -z-10" style={{ backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
        <div className="px-6 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#01446333] bg-white/70 px-3 py-1 text-sm text-[#014463]">
              <span className="h-2 w-2 rounded-full bg-[#014463]" />
              Minnesota-first skip tracing
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Find people and properties in Minnesota. Fast.
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              A modern, free skip tracing experience with clean results and actionable data for Minnesota. Built for speed, clarity, and accuracy.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-[#014463] px-6 py-3 text-white font-medium hover:bg-[#013347] transition-colors">
                Get started free
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Explore features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="h-10 w-10 rounded-lg bg-[#0144631A] text-[#014463] flex items-center justify-center">🔎</div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Clean, focused results</h3>
          <p className="mt-2 text-gray-600">Only the data you need. No clutter. Names, phones, emails, properties—clearly grouped and easy to action.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="h-10 w-10 rounded-lg bg-[#0144631A] text-[#014463] flex items-center justify-center">⚡</div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Fast and reliable</h3>
          <p className="mt-2 text-gray-600">Optimized for performance across Minnesota sources. Results stream quickly with minimal friction.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="h-10 w-10 rounded-lg bg-[#0144631A] text-[#014463] flex items-center justify-center">🗺️</div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Minnesota-first coverage</h3>
          <p className="mt-2 text-gray-600">Built for Minneapolis, Saint Paul, Rochester, Duluth—every city and county in Minnesota.</p>
        </div>
      </section>
    </PageLayout>
  );
}
