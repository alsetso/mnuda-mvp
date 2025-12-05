import { getAccountSubscriptionState } from '@/lib/subscriptionServer';
import type { Plan } from '@/features/auth/services/memberService';

interface FeatureGateProps {
  children: React.ReactNode;
  requiredPlan?: Plan;
  fallback?: React.ReactNode;
}

/**
 * FeatureGate Component
 * 
 * Server component that gates features based on subscription plan.
 * 
 * @example
 * ```tsx
 * <FeatureGate requiredPlan="pro">
 *   <ProOnlyFeature />
 * </FeatureGate>
 * ```
 */
export async function FeatureGate({ 
  children, 
  requiredPlan = 'hobby',
  fallback 
}: FeatureGateProps) {
  const state = await getAccountSubscriptionState();
  
  // Check if user has required plan
  const hasAccess = requiredPlan === 'hobby' 
    ? (state.plan === 'hobby' || state.plan === 'pro')
    : state.plan === 'pro';
  
  // Also check if subscription is active or comped
  if (!hasAccess || (!state.isActive && !state.isComped)) {
    return fallback || (
      <div className="p-4 border-2 border-gray-200 rounded-lg">
        <p className="text-gray-600 mb-2">
          {requiredPlan === 'pro' 
            ? 'This feature requires a Pro subscription.'
            : 'This feature requires an active subscription.'}
        </p>
        <a 
          href="/account/billing" 
          className="text-black font-semibold underline hover:no-underline"
        >
          {requiredPlan === 'pro' ? 'Upgrade to Pro' : 'Subscribe Now'}
        </a>
      </div>
    );
  }
  
  return <>{children}</>;
}

/**
 * PlanBadge Component
 * 
 * Displays the user's current plan badge.
 */
export async function PlanBadge() {
  const state = await getAccountSubscriptionState();
  
  if (!state.isActive && !state.isComped) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
        No Plan
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
      state.plan === 'pro' 
        ? 'bg-black text-white' 
        : 'bg-gray-200 text-gray-700'
    }`}>
      {state.plan === 'pro' ? 'Pro' : 'Hobby'}
      {state.isTrial && (
        <span className="ml-1 text-xs opacity-75">(Trial)</span>
      )}
    </span>
  );
}


