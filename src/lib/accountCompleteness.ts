import { Account } from '@/features/auth';

/**
 * Check if account exists (accounts no longer have required fields like username)
 * Username is now on profiles, so we just check if account exists
 */
export function isAccountComplete(account: Account | null): boolean {
  // Account is "complete" if it exists - user manages profiles separately
  return !!account;
}

/**
 * Get account completion status
 */
export function getAccountCompletionStatus(account: Account | null): {
  isComplete: boolean;
  missingFields: string[];
} {
  if (!account) {
    return {
      isComplete: false,
      missingFields: ['account'],
    };
  }

  // Account exists, so it's complete
  return {
    isComplete: true,
    missingFields: [],
  };
}

