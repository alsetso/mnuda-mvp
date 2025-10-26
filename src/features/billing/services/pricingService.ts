import { createClient } from '@/lib/supabase';
import { Plan } from '../types/plan';

export class PricingService {
  /**
   * Fetch all active pricing plans from the database
   */
  static async getPlans(): Promise<Plan[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Failed to fetch pricing plans');
    }

    return data.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceCents: plan.price_cents,
      billingInterval: plan.billing_interval,
      creditsPerPeriod: plan.credits_per_period,
      stripePriceId: plan.stripe_price_id,
      isActive: plan.is_active,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    }));
  }

  /**
   * Get a specific plan by ID
   */
  static async getPlanById(planId: string): Promise<Plan | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      priceCents: data.price_cents,
      billingInterval: data.billing_interval,
      creditsPerPeriod: data.credits_per_period,
      stripePriceId: data.stripe_price_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get the free plan
   */
  static async getFreePlan(): Promise<Plan | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('name', 'Free')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching free plan:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      priceCents: data.price_cents,
      billingInterval: data.billing_interval,
      creditsPerPeriod: data.credits_per_period,
      stripePriceId: data.stripe_price_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
