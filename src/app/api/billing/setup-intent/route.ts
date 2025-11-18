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

    // Get Stripe customer ID (must exist before creating setup intent)
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (memberError) {
      console.error('Error fetching member:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch member data' },
        { status: 500 }
      );
    }

    if (!member.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer not found. Please create a customer first.' },
        { status: 400 }
      );
    }

    const customerId = member.stripe_customer_id;

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

