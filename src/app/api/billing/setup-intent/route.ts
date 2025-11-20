import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { stripe } from '@/lib/stripe';

/**
 * Create a Setup Intent for adding a payment method
 * POST /api/billing/setup-intent
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get account data
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Failed to fetch account data' },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found. Please complete your account setup first.' },
        { status: 404 }
      );
    }

    let customerId = account.stripe_customer_id;

    // Create Stripe customer if it doesn't exist
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            userId: user.id,
          },
        });

        // Save customer ID to accounts table
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ stripe_customer_id: customer.id })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating account with Stripe customer ID:', updateError);
          return NextResponse.json(
            { error: 'Failed to save customer ID' },
            { status: 500 }
          );
        }

        customerId = customer.id;
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to create customer' },
          { status: 500 }
        );
      }
    }

    // Create Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}

