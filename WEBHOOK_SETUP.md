# Stripe Webhook Setup Guide

## What Was Implemented

### 1. Store Function (`packages/store/src/billing.ts`)
- ✅ Added `syncStripeData(customerId)` function
- Fetches subscription data from Stripe
- Upserts subscription data into the `subscriptions` table
- Handles multiple subscriptions (uses most recent active one)
- Extracts card information from payment methods

### 2. Express API Server (`apps/api/`)
- ✅ Express server with GraphQL Yoga integration
- ✅ Webhook handler at `/webhooks/stripe`
- ✅ Handles 19 different Stripe event types
- ✅ Verifies webhook signatures for security
- ✅ Syncs subscription data on each event

### 3. Docker Setup (`packages/docker-dev/`)
- ✅ Stripe CLI Docker service for local webhook testing
- ✅ Automatically forwards webhooks to local API server

## Next Steps - What You Need to Do

### Step 1: Install Dependencies

```bash
# Install API server dependencies
cd apps/api
npm install

# Install root dependencies (if needed)
cd ../..
npm install express @types/express graphql graphql-yoga tsx
```

### Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get this from Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# API Server Port (optional, defaults to 4000)
API_PORT=4000
```

**To get your webhook secret:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create a new endpoint pointing to your production URL: `https://yourdomain.com/webhooks/stripe`
3. Copy the "Signing secret" (starts with `whsec_`)

### Step 3: Start the API Server

```bash
cd apps/api
npm run dev
```

The server will start on `http://localhost:4000`

### Step 4: Local Testing with Stripe CLI

**Option A: Using Docker (Recommended)**

```bash
cd packages/docker-dev
docker-compose up -d stripe-cli
docker exec -it mnuda-stripe-cli stripe login
```

**Option B: Using Stripe CLI Directly**

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to http://localhost:4000/webhooks/stripe
```

### Step 5: Test Webhooks

1. **Trigger a test event:**
   ```bash
   stripe trigger checkout.session.completed
   ```

2. **Or create a test subscription in Stripe Dashboard:**
   - Go to Stripe Dashboard → Products → Create subscription
   - Use a test card: `4242 4242 4242 4242`
   - The webhook will automatically sync the subscription to your database

### Step 6: Production Setup

1. **Deploy your API server** to your hosting provider
2. **Update Stripe webhook endpoint:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/webhooks/stripe`
   - Select all the events listed in the webhook handler
   - Copy the signing secret to your production environment variables

3. **Verify webhooks are working:**
   - Check your API server logs for webhook events
   - Verify subscriptions are being created/updated in your database

## File Structure

```
apps/api/
├── src/
│   ├── server.ts              # Express server setup
│   ├── webhooks/
│   │   └── stripe.ts          # Webhook handler
│   └── schema/
│       └── settings/
│           └── billing.ts     # GraphQL schema
├── package.json
├── tsconfig.json
└── README.md

packages/store/
└── src/
    ├── billing.ts             # Business logic (syncStripeData)
    └── index.ts

packages/docker-dev/
├── docker-compose.yml         # Stripe CLI service
└── README.md
```

## How It Works

1. **Stripe sends webhook** → Your API server receives it at `/webhooks/stripe`
2. **Signature verification** → Server verifies the webhook is from Stripe
3. **Event processing** → Extracts customer ID from the event
4. **Data sync** → Calls `store.billing.syncStripeData(customerId)`
5. **Database update** → Subscription data is upserted into `subscriptions` table

## Troubleshooting

### Webhook signature verification fails
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
- Ensure the webhook endpoint is using raw body (already configured)

### Subscription not syncing
- Check API server logs for errors
- Verify the customer ID exists in your `accounts` table
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Docker Stripe CLI not working
- Make sure Docker is running
- Check that the API server is running on port 4000
- Verify `STRIPE_SECRET_KEY` is set in your environment

## Events Handled

The webhook handler processes these Stripe events:
- `checkout.session.completed`
- `customer.subscription.*` (all subscription lifecycle events)
- `invoice.*` (payment events)
- `payment_intent.*` (payment processing events)

All events trigger a sync of subscription data to keep your database up-to-date.


