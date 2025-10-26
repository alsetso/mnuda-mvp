import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { stripe, createStripeCustomerIfMissing } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    // Handle both form data and JSON
    const contentType = req.headers.get('content-type');
    let userId: string;

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      userId = formData.get('userId') as string;
    } else {
      const body = await req.json();
      userId = body.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Debug: Let's see what profiles exist
    console.log('=== DEBUGGING PROFILE LOOKUP ===');
    console.log('Searching for userId:', userId);
    
    // First, let's see all profiles to understand the structure
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, user_id, email, stripe_customer_id')
      .limit(5);
    
    console.log('All profiles (first 5):', allProfiles);
    console.log('All profiles error:', allProfilesError);

    // Get the user profile - try both id and user_id fields
    let profile = null;
    let profileError = null;

    // First try with id field
    console.log('Trying to find profile with id =', userId);
    const { data: profileById, error: errorById } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, id, user_id')
      .eq('id', userId)
      .single();

    console.log('Profile by id result:', profileById);
    console.log('Profile by id error:', errorById);

    if (profileById) {
      profile = profileById;
    } else {
      // Try with user_id field
      console.log('Trying to find profile with user_id =', userId);
      const { data: profileByUserId, error: errorByUserId } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, id, user_id')
        .eq('user_id', userId)
        .single();

      console.log('Profile by user_id result:', profileByUserId);
      console.log('Profile by user_id error:', errorByUserId);

      if (profileByUserId) {
        profile = profileByUserId;
      } else {
        profileError = errorByUserId;
      }
    }

    if (profileError || !profile) {
      console.error('=== PROFILE NOT FOUND - CREATING PROFILE ===');
      console.error('Searched for userId:', userId);
      console.error('Profile error:', profileError);
      console.error('Available profiles:', allProfiles);
      
      // Since the user is authenticated and clicking the button, let's create a profile
      try {
        console.log('Creating new profile for user:', userId);
        
        // First, let's get the user's email from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !user) {
          console.error('Could not get user from auth:', userError);
          return NextResponse.json({ error: 'User not found in authentication system' }, { status: 404 });
        }
        
        console.log('Found user in auth:', user.email);
        
        // Create a new profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            user_id: userId,
            email: user.email,
            user_type: 'free',
            subscription_status: 'free'
          })
          .select('stripe_customer_id, email, id, user_id')
          .single();
        
        if (createError || !newProfile) {
          console.error('Error creating profile:', createError);
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }
        
        console.log('Created new profile:', newProfile);
        profile = newProfile;
        
      } catch (error) {
        console.error('Error in profile creation:', error);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    }

    console.log('=== FOUND PROFILE ===');
    console.log('Profile:', profile);

    // Ensure user has a Stripe customer ID, create if missing
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      try {
        customerId = await createStripeCustomerIfMissing(profile.id, profile.email, supabase);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 });
      }
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/billing`,
    });

    // Redirect directly to the portal session URL as Stripe recommends
    return NextResponse.redirect(session.url);

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}