'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AccountService, Account } from '@/features/auth';
import AccountSidebar from '@/components/AccountSidebar';
import AccountHero from '@/components/AccountHero';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import { PencilIcon, XMarkIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface SettingsClientProps {
  initialAccount: Account;
  userEmail: string;
}

export default function SettingsClient({ initialAccount, userEmail }: SettingsClientProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [account, setAccount] = useState<Account>(initialAccount);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: initialAccount.first_name || '',
    last_name: initialAccount.last_name || '',
    gender: initialAccount.gender || '',
    age: initialAccount.age?.toString() || '',
    image_url: initialAccount.image_url,
  });

  const handleEditClick = () => {
    setEditForm({
      first_name: account.first_name || '',
      last_name: account.last_name || '',
      gender: account.gender || '',
      age: account.age?.toString() || '',
      image_url: account.image_url,
    });
    setIsEditing(true);
    setEditError('');
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    
    try {
      const updatedAccount = await AccountService.updateCurrentAccount({
        first_name: editForm.first_name.trim() || null,
        last_name: editForm.last_name.trim() || null,
        gender: editForm.gender || null,
        age: editForm.age ? parseInt(editForm.age) : null,
        image_url: editForm.image_url,
      });
      setAccount(updatedAccount);
      setIsEditing(false);
      
      // Revalidate server data
      router.refresh();
    } catch (error) {
      console.error('Error updating account:', error);
      setEditError(`Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleFormChange = (field: keyof typeof editForm, value: string | null) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const displayName = AccountService.getDisplayName(account);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AccountHero onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AccountSidebar 
          className="border-r-2 border-gray-200 bg-gray-50" 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-10 safe-area-inset">
            <div className="space-y-6">

              {/* Error Message */}
              {editError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {editError}
                </div>
              )}

              {/* Account Information Section */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-black">Account Information</h2>
                      <p className="text-xs text-gray-600 mt-1">
                        Your personal account details. This is separate from your operational profiles.
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={handleEditClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600 border-2 border-gray-400 rounded hover:bg-gray-400 hover:text-white transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-5">
                      {/* Account Image */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Account Image
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Your account profile picture. This is different from profile images on your operational profiles.
                        </p>
                        <ImageUpload
                          value={editForm.image_url}
                          onChange={(url) => handleFormChange('image_url', url as string | null)}
                          bucket="logos"
                          table="accounts"
                          column="image_url"
                          label="Upload account image"
                          className="w-full"
                        />
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => handleFormChange('first_name', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                          placeholder="John"
                          disabled={editLoading}
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => handleFormChange('last_name', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                          placeholder="Doe"
                          disabled={editLoading}
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={editForm.gender}
                          onChange={(e) => handleFormChange('gender', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                          disabled={editLoading}
                        >
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          value={editForm.age}
                          onChange={(e) => handleFormChange('age', e.target.value)}
                          min="18"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                          placeholder="25"
                          disabled={editLoading}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleEditSave}
                          disabled={editLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={handleEditCancel}
                          disabled={editLoading}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {account.image_url && (
                        <div>
                          <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account Image</dt>
                          <dd>
                            <img 
                              src={account.image_url} 
                              alt={displayName}
                              className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                            />
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Account Name</dt>
                        <dd className="text-base font-medium text-black">
                          {displayName || <span className="italic text-gray-400">Not set</span>}
                        </dd>
                      </div>
                      {account.gender && (
                        <div>
                          <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gender</dt>
                          <dd className="text-base font-medium text-black capitalize">{account.gender}</dd>
                        </div>
                      )}
                      {account.age && (
                        <div>
                          <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Age</dt>
                          <dd className="text-base font-medium text-black">{account.age}</dd>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-black text-black mb-4">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</dt>
                    <dd className="text-base font-medium text-black">{userEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</dt>
                    <dd className="text-base font-medium text-black capitalize">{account.role || 'general'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Account created</dt>
                    <dd className="text-base font-medium text-black">
                      {account.created_at ? new Date(account.created_at).toLocaleDateString() : 'Unknown'}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Profiles Link */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-black mb-1">Operational Profiles</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Manage your different personal and professional experiences with profiles.
                    </p>
                    <p className="text-xs text-gray-500">
                      Profiles are separate from your account information above.
                    </p>
                  </div>
                  <a
                    href="/account/profiles"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Manage Profiles
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-black text-black mb-4">Account Actions</h3>
                
                {signOutError && (
                  <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {signOutError}
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div>
                    <h4 className="text-base font-bold text-black mb-1">Sign Out</h4>
                    <p className="text-sm text-gray-600">Sign out of your account on this device</p>
                  </div>
                  <button
                    onClick={handleSignOutClick}
                    disabled={isSigningOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Sign Out Confirmation Modal */}
              {showSignOutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl border-2 border-gray-200 shadow-2xl w-full max-w-md mx-4">
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
                            className="flex-1 px-4 py-2 text-sm font-semibold text-black border-2 border-black rounded-lg hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSignOutConfirm}
                            disabled={isSigningOut}
                            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </main>
      </div>
    </div>
  );
}
