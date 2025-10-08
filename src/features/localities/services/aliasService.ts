/**
 * Alias resolution service for city slugs
 * Handles 301 redirects from aliases to canonical slugs
 */

import { createServerClient } from '@/lib/supabaseServer';

/**
 * Check if slug is an alias and return canonical slug
 * Returns null if slug is not an alias
 */
export async function resolveAlias(slug: string): Promise<string | null> {
  const supabase = createServerClient();

  // Check if slug exists in aliases array of any city
  const { data } = await supabase
    .from('cities')
    .select('slug, aliases')
    .eq('state_code', 'MN')
    .eq('status', 'active')
    .contains('aliases', [slug])
    .limit(1)
    .single();

  if (data && (data as Record<string, unknown>).slug !== slug) {
    return (data as Record<string, unknown>).slug as string;
  }

  return null;
}

