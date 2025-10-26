import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createStripeCustomerIfMissing } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Use the centralized helper function
    const customerId = await createStripeCustomerIfMissing(userId, email, supabase);

    return NextResponse.json({ 
      customerId: customerId,
      message: 'Customer created successfully' 
    });

  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}