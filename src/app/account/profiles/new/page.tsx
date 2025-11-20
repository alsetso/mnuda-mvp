import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import { isAccountComplete } from '@/lib/accountCompleteness';
import NewProfileClient from './NewProfileClient';

export default async function NewProfilePage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/profiles/new&message=Please sign in to create a profile');
  }

  const account = await getServerAccount();
  
  if (!account) {
    redirect('/account/onboarding?redirect=/account/profiles/new&message=Please complete your account setup');
  }

  // Check if onboarding is complete
  if (!isAccountComplete(account)) {
    redirect('/account/onboarding?redirect=/account/profiles/new&message=Please complete your account setup');
  }

  return <NewProfileClient initialAccount={account} />;
}

