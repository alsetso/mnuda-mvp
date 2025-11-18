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

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (memberError) {
      console.error('Error fetching member:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch member data' },
        { status: 500 }
      );
    }

    // If customer already exists, return it
    if (member.stripe_customer_id) {
      // Verify customer still exists in Stripe
      try {
        const customer = await stripe.customers.retrieve(member.stripe_customer_id);
        if (customer && !customer.deleted) {
          return NextResponse.json({
            customer_id: member.stripe_customer_id,
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
      email: member.email || user.email!,
      metadata: {
        userId: user.id,
      },
    });

    // Store customer ID in members table
    const { error: updateError } = await supabase
      .from('members')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating member with Stripe customer ID:', updateError);
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

    // Get member data
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

    return NextResponse.json({
      customer_id: member.stripe_customer_id || null,
      has_customer: !!member.stripe_customer_id,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

