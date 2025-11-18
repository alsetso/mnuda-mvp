import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getServerAuth } from '@/lib/authServer';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

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

    const { data: categories, error } = await supabase
      .from('pins_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('is_active', { ascending: false });

    if (error) {
      console.error('Error fetching pin categories:', error);
      return NextResponse.json(
        { error: `Failed to fetch categories: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('Error fetching pin categories:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('authenticated') ? 401 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch pin categories' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId, is_public } = body;

    if (!categoryId || typeof is_public !== 'boolean') {
      return NextResponse.json(
        { error: 'categoryId and is_public (boolean) are required' },
        { status: 400 }
      );
    }

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

    const { data: category, error } = await supabase
      .from('pins_categories')
      .update({ is_public })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pin category:', error);
      return NextResponse.json(
        { error: `Failed to update category: ${error.message}` },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating pin category:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('authenticated') ? 401 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update pin category' },
      { status: 500 }
    );
  }
}

