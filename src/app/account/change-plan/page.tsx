import { getServerAccount } from '@/lib/accountServer';
import { getServerBillingData } from '@/lib/billingServer';
import { redirectToOnboardingIfNeeded } from '@/lib/onboardingRedirect';
import ChangePlanClient from './ChangePlanClient';

export default async function ChangePlanPage() {
  const account = await getServerAccount();
  
  // Redirect to onboarding if not onboarded
  redirectToOnboardingIfNeeded(account);

  const billingData = await getServerBillingData();

  return <ChangePlanClient initialBillingData={billingData} />;
}

