import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, customerEmail } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
    }

    // Simple checkout session - Stripe will create customer if needed
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: customerEmail, // Let Stripe handle customer creation
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
