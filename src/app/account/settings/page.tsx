import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/settings&message=Please sign in to access your settings');
  }

  const account = await getServerAccount();
  const userEmail = auth.email;

  if (!account) {
    redirect('/account/onboarding?message=Please complete your profile to access settings');
  }

  return <SettingsClient initialAccount={account} userEmail={userEmail} />;
}
