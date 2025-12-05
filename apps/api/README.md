# API Server

Express server with GraphQL Yoga and Stripe webhook handling.

## Setup

1. **Install dependencies:**
   ```bash
   cd apps/api
   npm install
   ```

2. **Environment variables:**
   Make sure these are set in your root `.env.local`:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

3. **Run the server:**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:4000`

## Endpoints

- `GET /health` - Health check
- `POST /webhooks/stripe` - Stripe webhook handler
- `POST /graphql` - GraphQL endpoint

## Webhook Events Handled

The webhook handler processes the following Stripe events:

- `checkout.session.completed`
- `customer.subscription.*` (created, updated, deleted, paused, resumed, etc.)
- `invoice.*` (paid, payment_failed, payment_action_required, etc.)
- `payment_intent.*` (succeeded, payment_failed, canceled)

All events trigger a sync of subscription data to the database via `store.billing.syncStripeData()`.

## Local Development with Stripe CLI

See `packages/docker-dev/README.md` for instructions on using the Stripe CLI Docker service to forward webhooks locally.


