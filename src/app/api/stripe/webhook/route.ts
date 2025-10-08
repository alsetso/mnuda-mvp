import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Get the profile by Stripe customer ID
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Determine subscription status based on Stripe subscription status
    let subscriptionStatus: string;
    switch (subscription.status) {
      case 'active':
        subscriptionStatus = 'active';
        break;
      case 'trialing':
        subscriptionStatus = 'trialing';
        break;
      case 'past_due':
        subscriptionStatus = 'past_due';
        break;
      case 'canceled':
        subscriptionStatus = 'canceled';
        break;
      case 'unpaid':
        subscriptionStatus = 'unpaid';
        break;
      case 'incomplete':
        subscriptionStatus = 'incomplete';
        break;
      case 'incomplete_expired':
        subscriptionStatus = 'incomplete_expired';
        break;
      default:
        subscriptionStatus = 'free';
    }

    // Update the profile
    const updateData = {
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString()
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (profile as any).id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`Updated subscription status to ${subscriptionStatus} for user ${(profile as any).id}`);
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Get the profile by Stripe customer ID
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Update the profile to canceled status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (profile as any).id);

    if (updateError) {
      console.error('Error updating subscription status to canceled:', updateError);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`Updated subscription status to canceled for user ${(profile as any).id}`);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    // Get the profile by Stripe customer ID
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Ensure subscription is marked as active after successful payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (profile as any).id);

    if (updateError) {
      console.error('Error updating subscription status after payment:', updateError);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`Payment succeeded, updated subscription status to active for user ${(profile as any).id}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    // Get the profile by Stripe customer ID
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Mark subscription as past_due after failed payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (profile as any).id);

    if (updateError) {
      console.error('Error updating subscription status after failed payment:', updateError);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`Payment failed, updated subscription status to past_due for user ${(profile as any).id}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
