import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { Database } from '@/types/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get article by slug to get the ID
    const supabase = createServerClient();
    const { data: article, error: articleError } = await supabase
      .from('admin_articles')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count using the database function
    const { error: incrementError } = await supabase.rpc('increment_article_view', {
      article_id: article.id,
    });

    if (incrementError) {
      console.error('Error incrementing view count:', incrementError);
      return NextResponse.json(
        { error: 'Failed to increment view count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in view tracking:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}


