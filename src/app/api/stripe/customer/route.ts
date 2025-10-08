import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Retrieve customer
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get attached payment methods (cards) using the modern Payment Methods API
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Also try to get all payment methods if no cards found
    let allPaymentMethods = [...paymentMethods.data];
    if (paymentMethods.data.length === 0) {
      const allPm = await stripe.paymentMethods.list({
        customer: customerId,
      });
      allPaymentMethods = allPm.data;
    }

    // Get the default payment method details if it exists
    const defaultPaymentMethodId = (customer as { invoice_settings?: { default_payment_method?: string } }).invoice_settings?.default_payment_method;
    let defaultPaymentMethod = null;
    
    if (defaultPaymentMethodId) {
      try {
        defaultPaymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
      } catch {
        // Default payment method not found or error retrieving
      }
    }

    // Add default payment method if it's not already in the list
    if (defaultPaymentMethod && !allPaymentMethods.find(pm => pm.id === defaultPaymentMethod.id)) {
      allPaymentMethods.push(defaultPaymentMethod);
    }

    // Format response with modern Payment Methods API
    const customerData = {
      id: customer.id,
      default_payment_method: defaultPaymentMethodId,
      payment_methods: allPaymentMethods.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      })),
    };

    return NextResponse.json(customerData);
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer' },
      { status: 500 }
    );
  }
}
