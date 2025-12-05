import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { createCheckoutSession } from '../../../../packages/store/src/billing';

/**
 * CreateCheckoutSessionInput - Input type for createCheckoutSession mutation
 */
export const CreateCheckoutSessionInput = {
  accountId: {
    type: new GraphQLNonNull(GraphQLString),
    description: 'The account ID to create a checkout session for',
  },
};

/**
 * CreateCheckoutSessionResponse - Response type for createCheckoutSession mutation
 */
export const CreateCheckoutSessionResponse = new GraphQLObjectType({
  name: 'CreateCheckoutSessionResponse',
  description: 'Response containing the Stripe checkout session URL',
  fields: {
    checkoutUrl: {
      type: GraphQLString,
      description: 'The URL to redirect the user to complete checkout',
    },
    error: {
      type: GraphQLString,
      description: 'Error message if checkout session creation failed',
    },
  },
});

/**
 * createCheckoutSession mutation
 * 
 * Creates a Stripe Checkout Session for the given account.
 * Automatically creates a Stripe customer if one doesn't exist.
 * 
 * @param {string} accountId - The account ID
 * @returns {Promise<{checkoutUrl: string | null, error: string | null}>}
 */
export const createCheckoutSessionMutation = {
  type: CreateCheckoutSessionResponse,
  description: 'Create a Stripe Checkout Session for subscription purchase',
  args: CreateCheckoutSessionInput,
  resolve: async (_: unknown, { accountId }: { accountId: string }) => {
    try {
      const checkoutUrl = await createCheckoutSession(accountId);
      return {
        checkoutUrl,
        error: null,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        checkoutUrl: null,
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      };
    }
  },
};


