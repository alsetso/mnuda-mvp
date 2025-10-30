"use client";

import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  UsersIcon, 
  TrashIcon, 
  PencilIcon,
  UserPlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export function WorkspaceSettings() {
  const {
    currentWorkspace,
    members,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    canManageWorkspace,
    canInviteMembers,
    getUserRole
  } = useWorkspace();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: currentWorkspace?.name || '',
    emoji: currentWorkspace?.emoji || '',
    description: currentWorkspace?.description || ''
  });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole] = useState<'member'>('member');

  if (!currentWorkspace) return null;

  const handleSave = async () => {
    try {
      await updateWorkspace(currentWorkspace.id, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        await deleteWorkspace(currentWorkspace.id);
      } catch (error) {
        console.error('Failed to delete workspace:', error);
      }
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setIsInviting(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const _handleRoleChange = async (profileId: string, newRole: 'owner' | 'member') => {
    try {
      await updateMemberRole(profileId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async (profileId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
      try {
        await removeMember(profileId);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <ShieldCheckIcon className="w-3 h-3" />;
      case 'member': return <UsersIcon className="w-3 h-3" />;
      default: return <UsersIcon className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Workspace Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Workspace Details</h3>
          {canManageWorkspace() && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="w-3 h-3" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Emoji
                </label>
                <input
                  type="text"
                  value={editForm.emoji}
                  onChange={(e) => setEditForm(prev => ({ ...prev, emoji: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="🏢"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe this workspace..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{currentWorkspace.emoji || '🏢'}</span>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{currentWorkspace.name}</h4>
                {currentWorkspace.description && (
                  <p className="text-xs text-gray-600">{currentWorkspace.description}</p>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Created {new Date(currentWorkspace.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Members ({members.length})</h3>
          {canInviteMembers() && (
            <button
              onClick={() => setIsInviting(!isInviting)}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <UserPlusIcon className="w-3 h-3" />
              <span>{isInviting ? 'Cancel' : 'Invite'}</span>
            </button>
          )}
        </div>

        {/* Invite Form */}
        {isInviting && (
          <div className="mb-4 p-3 bg-white rounded border border-gray-200">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Invite
                </button>
                <button
                  onClick={() => setIsInviting(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.profile_id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  {member.profile?.avatar_url ? (
                    <Image 
                      src={member.profile.avatar_url} 
                      alt={member.profile.full_name || 'User'}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {(member.profile?.full_name || member.profile?.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {member.profile?.full_name || member.profile?.email || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.profile?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="capitalize">{member.role}</span>
                </div>
                {canManageWorkspace() && member.role !== 'owner' && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleRemoveMember(member.profile_id, member.profile?.full_name || 'this member')}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove member"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      {getUserRole() === 'owner' && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-3">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Workspace</h4>
              <p className="text-xs text-gray-600">
                Permanently delete this workspace and all its data.
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
