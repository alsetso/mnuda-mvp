/**
 * Profile type constants and utilities
 * Stub implementation - profiles table has been removed
 */

export type ProfileType = 'homeowner' | 'realtor' | 'wholesaler' | 'investor';

/**
 * Format profile type for display
 * @param profileType - The profile type string
 * @returns Formatted profile type string
 */
export function formatProfileType(profileType: string | null | undefined): string | null {
  if (!profileType) return null;
  
  // Capitalize first letter and handle common types
  const formatted = profileType
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return formatted;
}

/**
 * Get all available profile types
 * @returns Array of profile type strings
 */
export function getAllProfileTypes(): ProfileType[] {
  return ['homeowner', 'realtor', 'wholesaler', 'investor'];
}

/**
 * Check if a profile type is valid
 * @param profileType - The profile type to check
 * @returns True if valid, false otherwise
 */
export function isValidProfileType(profileType: string | null | undefined): boolean {
  if (!profileType) return false;
  return getAllProfileTypes().includes(profileType.toLowerCase() as ProfileType);
}
