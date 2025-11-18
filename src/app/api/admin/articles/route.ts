import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getServerAuth } from '@/lib/authServer';
import { CreateArticleData } from '@/features/admin';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body: CreateArticleData = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Create article using cookie-based client
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

    const articleData = {
      ...body,
      created_by: auth.id,
      author_name: body.author_name || 'MNUDA Editorial',
      status: body.status || 'draft',
      published_at: body.status === 'published' && !body.published_at 
        ? new Date().toISOString() 
        : body.published_at,
    };

    const { data: article, error } = await supabase
      .from('admin_articles')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.error('Error creating article:', error);
      return NextResponse.json(
        { error: `Failed to create article: ${error.message}` },
        { status: 500 }
      );
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Failed to create article: no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('authenticated') ? 401 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const articles = await AdminArticleService.getAllArticles();

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('authenticated') ? 401 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

