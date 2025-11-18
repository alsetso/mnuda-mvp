import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { stripe } from '@/lib/stripe';

/**
 * Create a Stripe Customer Portal session
 * POST /api/billing/portal
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

    // Get Stripe customer ID
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (memberError || !member?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please add a payment method first.' },
        { status: 400 }
      );
    }

    // Get the return URL from request or use default
    const { return_url } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const defaultReturnUrl = `${baseUrl}/account/billing`;

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: member.stripe_customer_id,
      return_url: return_url || defaultReturnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

