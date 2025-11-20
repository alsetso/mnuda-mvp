import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { stripe } from '@/lib/stripe';

/**
 * Create or get Stripe customer for the current user
 * POST /api/billing/customer
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

    // If customer already exists, return it
    if (account.stripe_customer_id) {
      // Verify customer still exists in Stripe
      try {
        const customer = await stripe.customers.retrieve(account.stripe_customer_id);
        if (customer && !customer.deleted) {
          return NextResponse.json({
            customer_id: account.stripe_customer_id,
            created: false,
          });
        }
      } catch (error) {
        // Customer doesn't exist in Stripe, create a new one
        console.log('Customer not found in Stripe, creating new one');
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        userId: user.id,
      },
    });

    // Store customer ID in accounts table
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

    return NextResponse.json({
      customer_id: customer.id,
      created: true,
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: 500 }
    );
  }
}

/**
 * Get Stripe customer ID for the current user
 * GET /api/billing/customer
 */
export async function GET(request: NextRequest) {
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
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Failed to fetch account data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customer_id: account?.stripe_customer_id || null,
      has_customer: !!account?.stripe_customer_id,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}



