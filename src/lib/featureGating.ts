/**
 * Feature Gating Utilities
 * 
 * Simple feature gating based on account plan.
 * Use these helpers in server components, loaders, middleware, or RLS-safe queries.
 * 
 * @example
 * ```ts
 * // In a server component
 * import { getFeatureAccess } from '@/lib/featureGating';
 * 
 * const access = await getFeatureAccess();
 * 
 * if (access === 'limited_access') {
 *   return <LimitedFeatureView />;
 * }
 * 
 * if (access === 'full_access') {
 *   return <FullFeatureView />;
 * }
 * ```
 */

import { getAccountSubscriptionState } from './subscriptionServer';
import type { Plan } from '@/features/auth/services/memberService';

/**
 * Get feature access level based on account plan
 * 
 * Returns:
 * - 'limited_access' for hobby plan
 * - 'full_access' for pro plan
 * - null if not authenticated or no subscription
 * 
 * @param account - Account object with plan field
 * @returns Access level string or null
 */
export function getFeatureAccessFromAccount(account: { plan: Plan } | null): 'limited_access' | 'full_access' | null {
  if (!account) {
    return null;
  }

  if (account.plan === 'hobby') {
    return 'limited_access';
  }

  if (account.plan === 'pro') {
    return 'full_access';
  }

  return 'limited_access'; // Default fallback
}

/**
 * Get feature access level (async version that loads account)
 * 
 * Use this in server components, loaders, or middleware.
 * 
 * @returns Access level string or null
 */
export async function getFeatureAccess(): Promise<'limited_access' | 'full_access' | null> {
  const state = await getAccountSubscriptionState();
  
  if (!state.isActive && !state.isComped) {
    return null;
  }
  
  return getFeatureAccessFromAccount({ plan: state.plan });
}

/**
 * Check if user can access a specific feature
 * 
 * @param requiredPlan - Minimum plan required to access the feature
 * @returns true if user has required plan or higher
 */
export async function canAccessFeature(requiredPlan: Plan = 'hobby'): Promise<boolean> {
  const state = await getAccountSubscriptionState();
  
  if (!state.isActive && !state.isComped) {
    return false;
  }
  
  if (requiredPlan === 'hobby') {
    return true; // Everyone with subscription can access hobby features
  }
  
  if (requiredPlan === 'pro') {
    return state.plan === 'pro';
  }
  
  return false;
}


