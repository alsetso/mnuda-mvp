import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import OnboardingClient from './OnboardingClient';

interface OnboardingPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  // Step 1: Check authentication
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/onboarding&message=Please sign in to complete your account setup');
  }

  // Step 2: Get account data
  const account = await getServerAccount();
  const params = await searchParams;
  
  // Step 3: If already onboarded, redirect immediately (simple check, no loops)
  // Use strict equality check to avoid null/undefined issues
  if (account && account.onboarded === true) {
    const redirectTo = params.redirect || '/map';
    redirect(redirectTo);
  }

  // Step 4: If not onboarded or account doesn't exist, show onboarding form
  // Don't redirect if account is null - user needs to complete onboarding
  return <OnboardingClient initialAccount={account} redirectTo={params.redirect} />;
}
