import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { AdService } from '@/features/ads';

/**
 * Track ad impression or click
 * POST /api/ads/[id]/track?type=impression|click&placement=article_left&articleSlug=under-dev-and-acq
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'impression' | 'click';
    const placement = searchParams.get('placement') as 'article_left' | 'article_right' | 'article_both' | null;
    const articleSlug = searchParams.get('articleSlug');

    if (!type || (type !== 'impression' && type !== 'click')) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "impression" or "click"' },
        { status: 400 }
      );
    }

    if (!placement || (placement !== 'article_left' && placement !== 'article_right' && placement !== 'article_both')) {
      return NextResponse.json(
        { error: 'Valid placement parameter is required (article_left, article_right, or article_both)' },
        { status: 400 }
      );
    }

    // Get current user if authenticated
    let memberId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
          },
        },
      );
      const { data: { user } } = await supabase.auth.getUser();
      memberId = user?.id || null;
    } catch (error) {
      // User might not be authenticated, continue with null memberId
    }

    await AdService.trackEvent(
      id,
      type,
      placement,
      articleSlug || null,
      memberId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track ad' },
      { status: 500 }
    );
  }
}

