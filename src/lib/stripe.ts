import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// Helper function to create Stripe customer if missing
export const createStripeCustomerIfMissing = async (
  userId: string, 
  email: string, 
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<string> => {
  // Check if user already has a Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(`Profile not found: ${profileError.message}`);
  }

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId
    }
  });

  // Update profile with Stripe customer ID
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  return customer.id;
};
