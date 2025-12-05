import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { available: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate length (3-30 characters per migration)
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { available: false, error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    // Validate format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { available: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get current account
    const { data: currentAccount } = await supabase
      .from('accounts')
      .select('id, username')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!currentAccount) {
      return NextResponse.json(
        { available: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // If username matches current account username, it's available (no change)
    if (currentAccount.username === username) {
      return NextResponse.json({ available: true });
    }

    // Check if username exists for another account
    const { data: existing, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('username', username)
      .limit(1)
      .single();

    // If username exists for another account, it's not available
    if (existing && !error) {
      return NextResponse.json({ available: false });
    }

    // Username is available
    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
