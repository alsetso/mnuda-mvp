import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, profileId } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { available: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate length
    if (username.length <= 4) {
      return NextResponse.json(
        { available: false, error: 'Username must be more than 4 characters' },
        { status: 400 }
      );
    }

    // Validate format
    if (!/^[a-zA-Z0-9-]+$/.test(username)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
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

    // Get current profile to exclude from check (if editing)
    let currentProfileUsername: string | null = null;
    if (profileId) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('username, account_id, accounts!inner(user_id)')
        .eq('id', profileId)
        .eq('accounts.user_id', user.id)
        .single();
      
      if (currentProfile) {
        currentProfileUsername = currentProfile.username;
      }
    }

    // Check if username exists (excluding current profile's username)
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1)
      .single();

    // If username matches current profile's username, it's available (no change)
    if (currentProfileUsername === username) {
      return NextResponse.json({ available: true });
    }

    // If username exists for another profile, it's not available
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

