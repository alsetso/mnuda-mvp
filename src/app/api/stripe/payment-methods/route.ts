import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return NextResponse.json({ 
      paymentMethods: paymentMethods.data 
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}
