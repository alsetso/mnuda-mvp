import express from 'express';
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { stripeWebhookHandler } from './webhooks/stripe';

const app = express();
const PORT = process.env.API_PORT || 4000;

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stripe webhook endpoint - must use raw body for signature verification
// This route must be registered BEFORE express.json() middleware
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// JSON body parser for other routes
app.use(express.json());

// GraphQL endpoint (placeholder - can be expanded later)
const yoga = createYoga({
  schema: createSchema({
    typeDefs: `
      type Query {
        health: String!
      }
      type Mutation {
        _empty: String
      }
    `,
    resolvers: {
      Query: {
        health: () => 'ok',
      },
    },
  }),
  graphqlEndpoint: '/graphql',
});

app.use('/graphql', yoga);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🔔 Webhook endpoint: http://localhost:${PORT}/webhooks/stripe`);
  });
}

export default app;

