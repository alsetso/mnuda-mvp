import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import { redirectToOnboardingIfNeeded } from '@/lib/onboardingRedirect';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/settings&message=Please sign in to access your settings');
  }

  const account = await getServerAccount();
  
  // Redirect to onboarding if not onboarded (middleware also handles this, but this is a fallback)
  redirectToOnboardingIfNeeded(account);

  const userEmail = auth.email;

  return <SettingsClient initialAccount={account} userEmail={userEmail} />;
}
