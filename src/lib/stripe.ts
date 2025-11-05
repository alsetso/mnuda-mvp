import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// Helper function to create Stripe customer if missing
// Note: This function requires a profiles table which has been removed
// Update this when implementing a new user data storage solution
export const createStripeCustomerIfMissing = async (
  userId: string, 
  email: string, 
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<string> => {
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId
    }
  });

  // TODO: Store stripe_customer_id when user data storage is implemented
  return customer.id;
};
