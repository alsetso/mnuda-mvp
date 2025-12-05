import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerBillingData } from '@/lib/billingServer';
import { getAccountSubscriptionState } from '@/lib/subscriptionServer';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/billing&message=Please sign in to access your billing');
  }

  // Fetch billing data and subscription state in parallel for faster loading
  const [billingData] = await Promise.all([
    getServerBillingData(),
    getAccountSubscriptionState(), // Fetch but don't block on it
  ]);

  return <BillingClient initialBillingData={billingData} />;
}
