'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';

// Redirect old /onboarding to /account/onboarding
export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        router.replace('/account/onboarding');
      } else {
        router.replace('/login?redirect=/account/onboarding');
      }
    }
  }, [authLoading, user, router]);

  return null;
}
