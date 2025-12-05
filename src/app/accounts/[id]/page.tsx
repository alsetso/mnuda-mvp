import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Legacy route: /accounts/[id]
 * Redirects to /profile/[username] if account has a username
 * Otherwise shows 404 (accounts should have usernames after onboarding)
 */
export default async function AccountRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const { id } = await params;
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components can't set cookies
        },
      },
    }
  );

  // Try to find account by ID first, then by username (for backwards compatibility)
  const { data: accountById } = await supabase
    .from('accounts')
    .select('id, username')
    .eq('id', id)
    .maybeSingle();

  const account = accountById || (await supabase
    .from('accounts')
    .select('id, username')
    .eq('username', id)
    .maybeSingle()).data;

  if (!account) {
    notFound();
  }

  // If account has a username, redirect to profile page
  if (account.username) {
    redirect(`/profile/${account.username}`);
  }

  // If no username, account needs to complete onboarding
  // Show 404 as accounts should have usernames
  notFound();
}

