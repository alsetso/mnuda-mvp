import { redirect } from 'next/navigation';
import { getServerAccount } from '@/lib/accountServer';
import OnboardingClient from './OnboardingClient';

interface OnboardingPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  // Auth check is handled in layout.tsx
  const account = await getServerAccount();
  const params = await searchParams;
  
  // If already onboarded, redirect to profile page
  if (account && account.onboarded === true && account.username) {
    redirect(`/profile/${account.username}`);
  }
  
  // Show onboarding form for non-onboarded users
  return <OnboardingClient initialAccount={account} redirectTo={params.redirect} />;
}
