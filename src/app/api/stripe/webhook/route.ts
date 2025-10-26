import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // Check for idempotency - prevent double processing
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, message: 'Already processed' });
    }

    // Record the event for idempotency
    await supabase
      .from('stripe_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString()
      });

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'customer.updated':
        await handleCustomerUpdate(event.data.object as Stripe.Customer, supabase);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod, supabase);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, supabase: any) {
  try {
    const customerId = subscription.customer as string;
    
    // Get the user profile by stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Determine subscription status
    let subscriptionStatus = 'free';
    if (subscription.status === 'active') {
      subscriptionStatus = 'active';
    } else if (subscription.status === 'trialing') {
      subscriptionStatus = 'trialing';
    } else if (subscription.status === 'past_due') {
      subscriptionStatus = 'past_due';
    } else if (subscription.status === 'canceled') {
      subscriptionStatus = 'canceled';
    } else if (subscription.status === 'unpaid') {
      subscriptionStatus = 'unpaid';
    } else if (subscription.status === 'incomplete') {
      subscriptionStatus = 'incomplete';
    } else if (subscription.status === 'incomplete_expired') {
      subscriptionStatus = 'incomplete_expired';
    }

    // Get plan tier from subscription - use price ID to look up plan name
    const priceId = subscription.items.data[0]?.price?.id;
    let planTier = 'unknown';
    
    if (priceId) {
      // Look up plan name from your plans table
      const { data: planData } = await supabase
        .from('plans')
        .select('name')
        .eq('stripe_price_id', priceId)
        .single();
      
      if (planData) {
        planTier = planData.name.toLowerCase();
      } else {
        // Fallback to price nickname if plan not found in database
        planTier = subscription.items.data[0]?.price?.nickname || priceId;
      }
    }

    // Update the profile with enhanced data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscriptionStatus,
        stripe_subscription_id: subscription.id,
        plan_tier: planTier,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log(`Updated subscription status for user ${profile.id} to ${subscriptionStatus}`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdate:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  
  // Get the user profile by stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Update the profile to free status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'free',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error updating profile after subscription deletion:', updateError);
  } else {
    console.log(`Set user ${profile.id} to free status after subscription deletion`);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  
  // Get the user profile by stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Update subscription status to active
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error updating profile after successful payment:', updateError);
  } else {
    console.log(`Updated user ${profile.id} to active status after successful payment`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  try {
    const customerId = invoice.customer as string;
    
    // Get the user profile by stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile after failed payment:', updateError);
    } else {
      console.log(`Updated user ${profile.id} to past_due status after failed payment`);
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}

async function handleCustomerUpdate(customer: Stripe.Customer, supabase: any) {
  try {
    // Get the user profile by stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customer.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customer.id);
      return;
    }

    // Update billing email if it changed
    if (customer.email && customer.email !== profile.email) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: customer.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating customer email:', updateError);
      } else {
        console.log(`Updated email for user ${profile.id} to ${customer.email}`);
      }
    }
  } catch (error) {
    console.error('Error in handleCustomerUpdate:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod, supabase: any) {
  try {
    const customerId = paymentMethod.customer as string;
    
    // Get the user profile by stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Update default payment method if this is the default
    if (paymentMethod.id) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          default_payment_method: paymentMethod.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating default payment method:', updateError);
      } else {
        console.log(`Updated default payment method for user ${profile.id}`);
      }
    }
  } catch (error) {
    console.error('Error in handlePaymentMethodAttached:', error);
  }
}