import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import { getServerProfiles } from '@/lib/profileServer';
import { isAccountComplete } from '@/lib/accountCompleteness';
import ProfilesClient from './ProfilesClient';

export default async function ProfilesPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/profiles&message=Please sign in to access your profiles');
  }

  const account = await getServerAccount();
  
  if (!account) {
    redirect('/account/onboarding?redirect=/account/profiles&message=Please complete your account setup');
  }

  // Check if onboarding is complete
  if (!isAccountComplete(account)) {
    redirect('/account/onboarding?redirect=/account/profiles&message=Please complete your account setup');
  }

  const profiles = await getServerProfiles();

  return <ProfilesClient initialProfiles={profiles} initialAccount={account} />;
}
