import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SimplePageLayout from '@/components/SimplePageLayout';
import { getServerAccount as getServerAccountLib } from '@/lib/accountServer';
import ProfileClient from './ProfileClient';
import ProfilePageClient from './ProfilePageClient';
import type { Account } from '@/features/auth/services/memberService';

interface Post {
  id: string;
  title: string;
  content: string;
  images: unknown;
  visibility: string;
  view_count: number;
  created_at: string;
  // Map fields
  map_type?: 'pin' | 'area' | 'both' | null;
  map_geometry?: unknown;
  map_center?: unknown;
  map_screenshot?: string | null;
  map_data?: unknown;
}

async function getAccountByUsername(username: string): Promise<Account | null> {
  const cookieStore = await cookies();
  
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

  // Validate username format (basic check)
  if (!username || username.length < 3 || username.length > 30) {
    return null;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('id, username, first_name, last_name, image_url, cover_image_url, gender, bio, city_id, view_count, traits, plan')
    .eq('username', username)
    .single();

  if (error) {
    // Log error but don't expose details to client
    if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching account by username:', error);
    }
    return null;
  }

  if (!data) return null;
  
  return data as Account;
}

async function getAccountPosts(accountId: string, isOwnProfile: boolean): Promise<Post[]> {
  const cookieStore = await cookies();
  
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

  // Validate accountId format (UUID)
  if (!accountId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) {
    console.error('Invalid accountId format:', accountId);
    return [];
  }

  try {
    // Build query - only select columns that exist in posts table
    let query = supabase
      .from('posts')
      .select('id, title, content, images, visibility, view_count, created_at, map_type, map_geometry, map_center, map_screenshot, map_data')
      .eq('account_id', accountId);

    // If not own profile, only show public posts
    if (!isOwnProfile) {
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Log full error details for debugging
      const errorInfo: Record<string, unknown> = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        accountId: accountId.substring(0, 8) + '...',
        isOwnProfile,
      };
      
      // Try to get all error properties
      try {
        Object.getOwnPropertyNames(error).forEach(key => {
          if (!errorInfo[key]) {
            errorInfo[key] = (error as Record<string, unknown>)[key];
          }
        });
      } catch (e) {
        // Ignore if we can't access properties
      }
      
      console.error('Error fetching account posts:', errorInfo);
      return [];
    }

    return (data || []) as Post[];
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error in getAccountPosts:', err);
    return [];
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const account = await getAccountByUsername(username);
  
  if (!account) {
    notFound();
  }

  // Check if this is the current user's profile
  const currentAccount = await getServerAccountLib();
  const isOwnProfile = currentAccount?.id === account.id;

  const posts = await getAccountPosts(account.id, isOwnProfile);

  return (
    <SimplePageLayout contentPadding="px-0 py-0" footerVariant="light" hideFooter={true}>
      <ProfilePageClient accountId={account.id} accountUsername={account.username} />
      <ProfileClient
        account={account}
        posts={posts}
        isOwnProfile={isOwnProfile}
      />
    </SimplePageLayout>
  );
}

