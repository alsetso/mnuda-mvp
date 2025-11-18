import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/authServer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          set() {},
          remove() {},
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message || 'No user found',
      });
    }

    // Get member record directly
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    // Also get via getServerAuth
    const serverAuth = await getServerAuth();

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
      directQuery: {
        member,
        memberError: memberError ? {
          message: memberError.message,
          code: memberError.code,
          details: memberError.details,
        } : null,
        roleRaw: member?.role,
        roleType: typeof member?.role,
        roleStringified: member?.role ? String(member.role) : null,
      },
      serverAuth: {
        auth: serverAuth,
        role: serverAuth?.role,
        roleType: typeof serverAuth?.role,
      },
      comparison: {
        directRole: member?.role,
        serverAuthRole: serverAuth?.role,
        areEqual: member?.role === serverAuth?.role,
        stringEqual: String(member?.role || '') === String(serverAuth?.role || ''),
      },
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

