import { NextRequest, NextResponse } from 'next/server';
import { AdService } from '@/features/ads';

/**
 * Get active ads for public display
 * GET /api/ads/public?placement=article_left&articleSlug=under-dev-and-acq
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement') as 'article_left' | 'article_right';
    const articleSlug = searchParams.get('articleSlug');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (!placement || (placement !== 'article_left' && placement !== 'article_right')) {
      return NextResponse.json(
        { error: 'Valid placement parameter is required (article_left or article_right)' },
        { status: 400 }
      );
    }

    const ads = await AdService.getActiveAds(placement, articleSlug || null, limit);
    return NextResponse.json({ ads });
  } catch (error) {
    console.error('Error fetching public ads:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

