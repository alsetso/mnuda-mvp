import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import { redirectToOnboardingIfNeeded } from '@/lib/onboardingRedirect';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/notifications&message=Please sign in to access your notifications');
  }

  const account = await getServerAccount();
  
  // Redirect to onboarding if not onboarded
  redirectToOnboardingIfNeeded(account);

  return <NotificationsClient />;
}


