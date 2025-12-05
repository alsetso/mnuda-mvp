/**
 * Store - Business logic layer
 * 
 * This package contains business logic that can be shared across
 * different parts of the application (API routes, server actions, etc.)
 */

export * from './billing';

// Export store object for easier access
export const store = {
  billing: {
    createCheckoutSession: async (accountId: string) => {
      const { createCheckoutSession } = await import('./billing');
      return createCheckoutSession(accountId);
    },
    syncStripeData: async (customerId: string) => {
      const { syncStripeData } = await import('./billing');
      return syncStripeData(customerId);
    },
  },
};

