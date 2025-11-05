'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, MemberService, Member } from '@/features/auth';
import ProfilePhoto from '@/components/ProfilePhoto';
import MainContentNav from '@/components/MainContentNav';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: ''
  });

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    setSignOutError('');
    setShowSignOutConfirm(false);
    
    try {
      await signOut();
      localStorage.removeItem('freemap_sessions');
      localStorage.removeItem('freemap_current_session');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setSignOutError('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false);
  };

  const handleEditClick = () => {
    setEditForm({
      name: member?.name || ''
    });
    setIsEditing(true);
    setEditError('');
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditError('');
    setEditForm({
      name: ''
    });
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    
    try {
      const updatedMember = await MemberService.updateCurrentMember({
        name: editForm.name?.trim() || null
      });

      setMember(updatedMember);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      if (user) {
        try {
          let memberData = await MemberService.getCurrentMember();
          
          if (!memberData) {
            try {
              memberData = await MemberService.ensureMemberExists();
            } catch (createError) {
              console.error('Error creating member:', createError);
            }
          }

          if (!memberData) {
            memberData = await MemberService.getCurrentMember();
          }

          setMember(memberData);
          if (memberData) {
            setEditForm({
              name: memberData.name || ''
            });
          }
        } catch (error) {
          console.error('Error fetching member:', error);
        } finally {
          setMemberLoading(false);
        }
      } else {
        setMemberLoading(false);
      }
    };

    if (!isLoading) {
      fetchMember();
    }
  }, [user, isLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, user, router]);

  const handleMemberUpdate = (updatedMember: Member) => {
    setMember(updatedMember);
  };

  const getDisplayName = (): string => {
    return member?.name || user?.email?.split('@')[0] || 'User';
  };

  // Show loading state
  if (isLoading || memberLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <MainContentNav title="Settings" />
      
      {/* Account Settings */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-black mb-6">Account Settings</h2>
        
        {editError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {editError}
          </div>
        )}
        
          <div className="space-y-6">
            {/* Profile Photo and Basic Info */}
            <div className="flex items-center space-x-4">
              <ProfilePhoto 
                profile={member ? {
                  id: member.id,
                  avatar_url: member.avatar_url,
                  name: member.name,
                  email: member.email
                } : null} 
                size="lg" 
                editable={true}
                onUpdate={handleMemberUpdate}
              />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id="name"
                      value={editForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave();
                        } else if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                      className="flex-1 text-xl sm:text-2xl font-black text-black bg-transparent border-none outline-none focus:underline focus:underline-offset-4 focus:decoration-2 focus:decoration-black"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditSave}
                        disabled={editLoading}
                        className="p-1 text-green-600 hover:text-green-700 focus:outline-none disabled:opacity-50"
                        title="Save"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={editLoading}
                        className="p-1 text-red-600 hover:text-red-700 focus:outline-none disabled:opacity-50"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">Press Enter to save, Esc to cancel</p>
                </div>
              ) : (
              <div>
                  <div className="flex items-center gap-2 group">
                    <h3 className="text-xl sm:text-2xl font-black text-black">{getDisplayName()}</h3>
                    <button
                      onClick={handleEditClick}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-black focus:outline-none focus:opacity-100"
                      title="Edit name"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                <p className="text-sm sm:text-base text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Click photo to upload</p>
                </div>
              )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <dt className="text-sm font-semibold text-gray-700 mb-1">Name</dt>
                <dd className="text-sm font-medium text-black">{member?.name || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-700 mb-1">Role</dt>
                <dd className="text-sm font-medium text-black capitalize">{member?.role || 'general'}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-700 mb-1">Member since</dt>
                <dd className="text-sm font-medium text-black">
                  {member?.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-700 mb-1">Email verified</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.email_confirmed_at ? 'Verified' : 'Pending'}
                  </span>
                </dd>
              </div>
            </div>
          </div>
      </div>

      {/* Account Actions */}
      <div>
        <h3 className="text-xl font-black text-black mb-6">Account Actions</h3>
        
        {signOutError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {signOutError}
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="text-base font-bold text-black mb-1">Sign Out</h4>
              <p className="text-sm text-gray-600">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleSignOutClick}
              disabled={isLoading || isSigningOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSigningOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gold-200 shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-black text-black mb-2">
                  Sign out of your account?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  You&apos;ll need to sign in again to access your account.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSignOutCancel}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOutConfirm}
                    disabled={isSigningOut}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 border-2 border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 shadow-lg"
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

