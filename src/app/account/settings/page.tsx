import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import { isAccountComplete } from '@/lib/accountCompleteness';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/settings&message=Please sign in to access your settings');
  }

  const account = await getServerAccount();
  
  if (!account) {
    redirect('/account/onboarding?redirect=/account/settings&message=Please complete your account setup');
  }

  // Check if onboarding is complete
  if (!isAccountComplete(account)) {
    redirect('/account/onboarding?redirect=/account/settings&message=Please complete your account setup');
  }

  // Get user email from auth
  const userEmail = auth.email;

  return <SettingsClient initialAccount={account} userEmail={userEmail} />;
}
