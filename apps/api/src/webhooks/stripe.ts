import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../../../../src/lib/stripe';
import { store } from '../../../../packages/store/src';

/**
 * Extract customer ID from various Stripe event types
 */
function extractCustomerId(event: Stripe.Event): string | null {
  const data = event.data.object;

  // Most events have customer field
  if ('customer' in data && typeof data.customer === 'string') {
    return data.customer;
  }

  // checkout.session.completed has customer field
  if (event.type === 'checkout.session.completed') {
    const session = data as Stripe.Checkout.Session;
    return session.customer as string | null;
  }

  // subscription events have customer field
  if (event.type.startsWith('customer.subscription.')) {
    const subscription = data as Stripe.Subscription;
    return subscription.customer as string | null;
  }

  // invoice events have customer field
  if (event.type.startsWith('invoice.')) {
    const invoice = data as Stripe.Invoice;
    return invoice.customer as string | null;
  }

  // payment_intent events might have customer in metadata or charges
  if (event.type.startsWith('payment_intent.')) {
    const paymentIntent = data as Stripe.PaymentIntent;
    return paymentIntent.customer as string | null;
  }

  return null;
}

/**
 * Stripe webhook handler
 * 
 * Verifies webhook signature and processes Stripe events to sync subscription data.
 * Listens to subscription, invoice, and payment events.
 */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature using raw body
    // req.body is already a Buffer from express.raw() middleware
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret
    );
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
    return;
  }

  // List of events we handle
  const handledEvents = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.paused',
    'customer.subscription.resumed',
    'customer.subscription.pending_update_applied',
    'customer.subscription.pending_update_expired',
    'customer.subscription.trial_will_end',
    'invoice.paid',
    'invoice.payment_failed',
    'invoice.payment_action_required',
    'invoice.upcoming',
    'invoice.marked_uncollectible',
    'invoice.payment_succeeded',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
  ];

  // Check if this is an event we handle
  if (!handledEvents.includes(event.type)) {
    console.log(`Ignoring unhandled event type: ${event.type}`);
    res.status(200).json({ received: true, handled: false });
    return;
  }

  // Extract customer ID from event
  const customerId = extractCustomerId(event);

  if (!customerId) {
    console.warn(`Could not extract customer ID from event: ${event.type}`);
    res.status(200).json({ received: true, synced: false, reason: 'no_customer_id' });
    return;
  }

  try {
    // Sync subscription data to database
    await store.billing.syncStripeData(customerId);
    
    console.log(`✅ Synced subscription data for customer ${customerId} (event: ${event.type})`);
    
    res.status(200).json({ 
      received: true, 
      handled: true, 
      event_type: event.type,
      customer_id: customerId,
    });
  } catch (error) {
    console.error(`❌ Error syncing subscription data for customer ${customerId}:`, error);
    
    // Return 200 to Stripe to prevent retries for non-retryable errors
    // You may want to implement retry logic for specific error types
    res.status(200).json({ 
      received: true, 
      handled: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

