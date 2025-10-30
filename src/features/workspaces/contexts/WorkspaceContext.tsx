"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Types
export interface Workspace {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  profile_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

export interface WorkspaceContextType {
  // State
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (data: { name: string; emoji?: string; description?: string }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  
  // Member management
  inviteMember: (email: string, role: WorkspaceMember['role']) => Promise<void>;
  updateMemberRole: (profileId: string, role: WorkspaceMember['role']) => Promise<void>;
  removeMember: (profileId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  
  // Permissions
  canManageWorkspace: () => boolean;
  canInviteMembers: () => boolean;
  canEditContent: () => boolean;
  getUserRole: () => WorkspaceMember['role'] | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  // Using supabase client from import
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user
  const [user, setUser] = useState<{ id: string } | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        lastLoadedUserIdRef.current = user.id;
      }
      setUser(user);
    };
    
    getInitialUser();

    // Listen for auth state changes (only update if user ID actually changed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      // Only update if user ID actually changed
      if (newUserId !== lastLoadedUserIdRef.current) {
        lastLoadedUserIdRef.current = newUserId;
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setWorkspaces([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // RLS will automatically filter workspaces based on membership
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading workspaces:', error);
        throw error;
      }

      setWorkspaces(data || []);
      
      // Set first workspace as current if none selected
      setCurrentWorkspace(prev => {
        if (!prev && data && data.length > 0) {
          return data[0];
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
      setWorkspaces([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMembers = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url, email)
        `)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [currentWorkspace]);

  // Track last loaded workspace user ID to prevent unnecessary reloads
  const lastWorkspaceUserIdRef = useRef<string | null>(null);

  // Load workspaces when user changes (only if user ID actually changed)
  useEffect(() => {
    if (user?.id) {
      // Only reload if user ID changed
      if (user.id !== lastWorkspaceUserIdRef.current) {
        lastWorkspaceUserIdRef.current = user.id;
        loadWorkspaces();
      }
    } else {
      // Clear workspace data if user logged out
      if (lastWorkspaceUserIdRef.current !== null) {
        lastWorkspaceUserIdRef.current = null;
        setLoading(false);
        setWorkspaces([]);
        setCurrentWorkspace(null);
      }
    }
  }, [user?.id, loadWorkspaces]);

  // Load members when workspace changes
  useEffect(() => {
    if (currentWorkspace && user) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id, user]); // loadMembers is stable from useCallback, intentionally excluded

  // Email sending function
  const sendWorkspaceInvitationEmail = async (email: string, workspace: Workspace) => {
    try {
      const response = await fetch('/api/send-workspace-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          workspaceName: workspace.name,
          workspaceEmoji: workspace.emoji || '🏢',
          workspaceDescription: workspace.description,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email API error:', response.status, errorText);
        throw new Error(`Email API failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Email sending failed:', err);
      // Don't throw error - invitation was still added to database
      // Just log the error for debugging
    }
  };

  const createWorkspace = async (data: { name: string; emoji?: string; description?: string }): Promise<Workspace> => {
    if (!user) throw new Error('Not authenticated');

    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          ...data,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase workspace creation error:', error);
        throw new Error(`Workspace creation failed: ${error.message} (Code: ${error.code})`);
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          profile_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Supabase member creation error:', memberError);
        throw new Error(`Member creation failed: ${memberError.message} (Code: ${memberError.code})`);
      }

      setWorkspaces(prev => [workspace, ...prev]);
      setCurrentWorkspace(workspace);
      
      return workspace;
    } catch (err) {
      console.error('Workspace creation error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  };

  const updateWorkspace = async (id: string, data: Partial<Workspace>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
      
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update workspace');
    }
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkspaces(prev => prev.filter(w => w.id !== id));
      
      if (currentWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id);
        setCurrentWorkspace(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
  };

  const refreshWorkspaces = async (): Promise<void> => {
    await loadWorkspaces();
  };

  const inviteMember = async (email: string, role: WorkspaceMember['role']): Promise<void> => {
    if (!currentWorkspace) throw new Error('No workspace selected');

    try {
      // Check if user already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking existing profile:', profileError);
      }

      // Check if user is already a member (by email or profile_id)
      const { data: existingMembers, error: memberError } = await supabase
        .from('workspace_members')
        .select('profile_id, email')
        .eq('workspace_id', currentWorkspace.id);

      if (memberError) {
        console.error('Error checking existing members:', memberError);
        throw memberError;
      }

      // Check if already a member
      const isAlreadyMember = existingMembers?.some(member => 
        member.email === email || 
        (existingProfile && member.profile_id === existingProfile.id)
      );

      if (isAlreadyMember) {
        throw new Error('User is already a member of this workspace');
      }

      // Add to workspace_members (with or without profile_id)
      const memberData: Record<string, unknown> = {
        workspace_id: currentWorkspace.id,
        role,
        email,
        joined_at: new Date().toISOString()
      };

      if (existingProfile) {
        memberData.profile_id = existingProfile.id;
      }

      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert(memberData);

      if (insertError) {
        console.error('Error inserting member:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        console.error('Member data being inserted:', memberData);
        console.error('Current user:', user?.id);
        console.error('Current workspace:', currentWorkspace?.id);
        throw insertError;
      }

      // Send invitation email
      await sendWorkspaceInvitationEmail(email, currentWorkspace);

      // Refresh members list
      await loadMembers();
    } catch (err) {
      console.error('Failed to invite member:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to invite member');
    }
  };

  const updateMemberRole = async (profileId: string, role: WorkspaceMember['role']): Promise<void> => {
    if (!currentWorkspace) throw new Error('No workspace selected');

    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', currentWorkspace.id)
        .eq('profile_id', profileId);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.profile_id === profileId ? { ...m, role } : m
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const removeMember = async (profileId: string): Promise<void> => {
    if (!currentWorkspace) throw new Error('No workspace selected');

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', currentWorkspace.id)
        .eq('profile_id', profileId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.profile_id !== profileId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const refreshMembers = async (): Promise<void> => {
    await loadMembers();
  };

  // Permission helpers
  const getUserRole = (): WorkspaceMember['role'] | null => {
    if (!currentWorkspace || !user) return null;
    const member = members.find(m => m.profile_id === user.id);
    return member?.role || null;
  };

  const canManageWorkspace = (): boolean => {
    const role = getUserRole();
    return role === 'owner';
  };

  const canInviteMembers = (): boolean => {
    const role = getUserRole();
    return role === 'owner';
  };

  const canEditContent = (): boolean => {
    const role = getUserRole();
    return role === 'owner' || role === 'member';
  };

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    members,
    loading,
    error,
    setCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
    inviteMember,
    updateMemberRole,
    removeMember,
    refreshMembers,
    canManageWorkspace,
    canInviteMembers,
    canEditContent,
    getUserRole
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
