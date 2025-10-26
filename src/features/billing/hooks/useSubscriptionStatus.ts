'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';

export interface PlanInfo {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  billingInterval: string;
  creditsPerPeriod: number;
  stripePriceId: string;
  isActive: boolean;
}

export interface SubscriptionHealth {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'free';
  nextBillingDate: Date | null;
  planDetails: PlanInfo | null;
  upgradeEligibility: boolean;
  daysUntilRenewal: number | null;
  isActive: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export function useSubscriptionStatus() {
  const { user } = useAuth();
  const [subscriptionHealth, setSubscriptionHealth] = useState<SubscriptionHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // User data is now handled by the billing portal API

      // Fetch profile with subscription status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, active_subscription_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setSubscriptionHealth(null);
        return;
      }

      if (!profile) {
        console.warn('No profile found for user');
        setSubscriptionHealth(null);
        return;
      }

      // Fetch active subscription details
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          status,
          current_period_start,
          current_period_end,
          plans!inner(
            id,
            name,
            description,
            price_cents,
            billing_interval,
            credits_per_period,
            stripe_price_id,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        throw subscriptionError;
      }

      // Fetch available plans for upgrade eligibility
      const { data: availablePlans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (plansError) throw plansError;

      const currentStatus = subscription?.status || 'free';
      const isActive = ['active', 'trialing'].includes(currentStatus);
      
      let planDetails: PlanInfo | null = null;
      let nextBillingDate: Date | null = null;
      let daysUntilRenewal: number | null = null;

      if (subscription) {
        planDetails = {
          id: subscription.plans.id,
          name: subscription.plans.name,
          description: subscription.plans.description,
          priceCents: subscription.plans.price_cents,
          billingInterval: subscription.plans.billing_interval,
          creditsPerPeriod: subscription.plans.credits_per_period,
          stripePriceId: subscription.plans.stripe_price_id,
          isActive: subscription.plans.is_active,
        };

        if (subscription.current_period_end) {
          nextBillingDate = new Date(subscription.current_period_end);
          const now = new Date();
          daysUntilRenewal = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // Determine upgrade eligibility
      const currentPlanPrice = planDetails?.priceCents || 0;
      const hasHigherPlans = availablePlans?.some(plan => plan.price_cents > currentPlanPrice) || false;
      const upgradeEligibility = isActive && hasHigherPlans;

      // Determine if user can upgrade/downgrade
      const canUpgrade = isActive && hasHigherPlans;
      const canDowngrade = isActive && planDetails && planDetails.priceCents > 0;

      const health: SubscriptionHealth = {
        status: currentStatus as any,
        nextBillingDate,
        planDetails,
        upgradeEligibility,
        daysUntilRenewal,
        isActive,
        canUpgrade,
        canDowngrade,
      };

      setSubscriptionHealth(health);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();

    // Set up real-time subscription for profile and subscription changes
    if (user) {
      const subscription = supabase
        .channel('subscription_status_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          () => {
            fetchSubscriptionStatus();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'billing',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchSubscriptionStatus();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    subscriptionHealth,
    loading,
    error,
    refetch: fetchSubscriptionStatus,
  };
}
