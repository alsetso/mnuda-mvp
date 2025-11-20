import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerAccount } from '@/lib/accountServer';
import { isAccountComplete } from '@/lib/accountCompleteness';
import { getServerBillingData } from '@/lib/billingServer';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/billing&message=Please sign in to access your billing');
  }

  const account = await getServerAccount();
  
  if (!account) {
    redirect('/account/onboarding?redirect=/account/billing&message=Please complete your account setup');
  }

  // Check if onboarding is complete
  if (!isAccountComplete(account)) {
    redirect('/account/onboarding?redirect=/account/billing&message=Please complete your account setup');
  }

  const billingData = await getServerBillingData();

  return <BillingClient initialBillingData={billingData} />;
}
