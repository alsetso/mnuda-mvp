'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountSidebar from '@/components/AccountSidebar';
import AccountHero from '@/components/AccountHero';
import { Account, AccountType } from '@/features/auth';
import { ProfileService, Profile } from '@/features/profiles/services/profileService';
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const PROFILE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'renter', label: 'Resident' },
  { value: 'investor', label: 'Investor' },
  { value: 'realtor', label: 'Realtor' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'developer', label: 'Developer' },
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'business', label: 'Business' },
];

interface ProfilesClientProps {
  initialProfiles: Profile[];
  initialAccount: Account;
}

export default function ProfilesClient({ initialProfiles, initialAccount }: ProfilesClientProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [account] = useState<Account>(initialAccount);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCreateProfile = () => {
    router.push('/account/profiles/new');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  const handleProfileClick = (profileId: string) => {
    router.push(`/account/profiles/${profileId}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AccountHero onMenuToggle={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <AccountSidebar 
          className="border-r-2 border-gray-200 bg-gray-50" 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-10 safe-area-inset">

        <div className="mt-4 sm:mt-6 lg:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black">
                Profiles
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                Manage your operational profiles
              </p>
            </div>
            <button
              onClick={handleCreateProfile}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm touch-manipulation"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Profile
            </button>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {profiles.length === 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 lg:p-12 text-center">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                No profiles yet
              </p>
              <button
                onClick={handleCreateProfile}
                className="inline-flex items-center gap-2 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm sm:text-base touch-manipulation min-h-[44px] sm:min-h-[48px]"
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Create Your First Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
              {profiles.map((profile) => {
                const displayName = ProfileService.getDisplayName(profile);

                return (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileClick(profile.id)}
                    className="relative flex flex-col items-start text-left w-full bg-white border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 transition-all duration-200 group border-gray-200 hover:border-black"
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3 w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {profile.profile_image ? (
                          <img 
                            src={profile.profile_image} 
                            alt={displayName}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg sm:text-xl font-black text-gray-400">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-black text-black truncate">
                            {displayName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 capitalize mt-0.5">
                            {profile.profile_type.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}

