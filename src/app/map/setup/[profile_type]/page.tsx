'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import PageLayout from '@/components/PageLayout';
import { OnboardingMapContainer } from '@/components/OnboardingMapContainer';
import { ProfileType } from '@/features/auth';

const VALID_PROFILE_TYPES: ProfileType[] = [
  'homeowner',
  'renter',
  'investor',
  'realtor',
  'wholesaler',
  'contractor',
  'services',
  'developer',
  'property_manager',
  'organization',
];

export default function SetupMapPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProfile } = useProfile();

  const profileType = params?.profile_type as string;

  // Handle redirects
  useEffect(() => {
    if (authLoading) return;

    // Redirect if not authenticated
    if (!user) {
      router.replace(`/login?redirect=/map/setup/${profileType}`);
      return;
    }

    // Redirect if no profile selected
    if (!selectedProfile) {
      router.replace('/account/profiles');
      return;
    }

    // Validate profile_type parameter
    if (!profileType || !VALID_PROFILE_TYPES.includes(profileType as ProfileType)) {
      router.replace('/account/profiles');
      return;
    }

    // Redirect if profile_type doesn't match selected profile
    if (selectedProfile.profile_type !== profileType) {
      router.replace(`/map/setup/${selectedProfile.profile_type}`);
      return;
    }

    // Redirect if already onboarded
    if (selectedProfile.onboarded) {
      router.replace('/map');
      return;
    }
  }, [authLoading, user, selectedProfile, profileType, router]);

  // Show loading state while checking auth or redirecting
  if (
    authLoading ||
    !user ||
    !selectedProfile ||
    !profileType ||
    !VALID_PROFILE_TYPES.includes(profileType as ProfileType) ||
    selectedProfile.profile_type !== profileType ||
    selectedProfile.onboarded
  ) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
        <div className="h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
      <OnboardingMapContainer />
    </PageLayout>
  );
}

