import { Account } from '@/features/auth';

/**
 * Check if account has all required personal information fields
 * Required: first_name, last_name, gender, age, image_url
 */
export function isAccountComplete(account: Account | null): boolean {
  if (!account) return false;
  
  return !!(
    account.first_name &&
    account.last_name &&
    account.gender &&
    account.age &&
    account.image_url
  );
}

/**
 * Get account completion status with missing fields
 */
export function getAccountCompletionStatus(account: Account | null): {
  isComplete: boolean;
  missingFields: string[];
} {
  if (!account) {
    return {
      isComplete: false,
      missingFields: ['account', 'first_name', 'last_name', 'gender', 'age', 'image_url'],
    };
  }

  const missingFields: string[] = [];
  if (!account.first_name) missingFields.push('first_name');
  if (!account.last_name) missingFields.push('last_name');
  if (!account.gender) missingFields.push('gender');
  if (!account.age) missingFields.push('age');
  if (!account.image_url) missingFields.push('image_url');

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

