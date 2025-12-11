import { redirect } from 'next/navigation';
import { getServerAccount } from '@/lib/accountServer';
import { redirectToOnboardingIfNeeded } from '@/lib/onboardingRedirect';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const account = await getServerAccount();
  
  if (!account) {
    redirect('/login?redirect=/account/analytics');
  }

  // Redirect to onboarding if not onboarded
  redirectToOnboardingIfNeeded(account);

  return <AnalyticsClient />;
}


