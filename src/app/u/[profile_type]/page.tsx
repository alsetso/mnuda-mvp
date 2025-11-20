'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import ProfilePhoto from '@/components/ProfilePhoto';

const PROFILE_TYPE_LABELS: Record<string, string> = {
  renter: 'Resident',
  investor: 'Investor',
  realtor: 'Realtor',
  wholesaler: 'Wholesaler',
  contractor: 'Contractor',
  services: 'Service Provider',
  developer: 'Developer',
  property_manager: 'Property Manager',
  organization: 'Organization',
  homeowner: 'Homeowner',
};

export default function ProfileTypePage({ params }: { params: { profile_type: string } }) {
  const router = useRouter();
  const { selectedProfile } = useProfile();

  useEffect(() => {
    if (selectedProfile && selectedProfile.profile_type !== params.profile_type) {
      router.push(`/u/${selectedProfile.profile_type}`);
      return;
    }
  }, [selectedProfile, params.profile_type, router]);

  if (!selectedProfile || selectedProfile.profile_type !== params.profile_type) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const profileTypeLabel = PROFILE_TYPE_LABELS[params.profile_type] || params.profile_type;

  return (
    <PageLayout>
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="mb-8 flex items-center gap-4">
            <ProfilePhoto
              profile={selectedProfile}
              size={64}
              className="rounded-full border-2 border-black"
            />
            <div>
              <h1 className="text-3xl font-bold text-black">
                {selectedProfile.username || 'Profile'}
              </h1>
              <p className="text-lg text-gray-700">{profileTypeLabel}</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              {profileTypeLabel} Dashboard
            </h2>
            <p className="text-gray-600">
              Welcome to your {profileTypeLabel.toLowerCase()} dashboard. This page is your base for managing your profile and activities.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

