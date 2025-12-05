import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import { getServerBillingData } from '@/lib/billingServer';
import ChangePlanClient from './ChangePlanClient';

export default async function ChangePlanPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/change-plan&message=Please sign in to change your plan');
  }

  const billingData = await getServerBillingData();

  return <ChangePlanClient initialBillingData={billingData} />;
}
