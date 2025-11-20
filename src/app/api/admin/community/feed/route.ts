import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminCommunityFeedService } from '@/features/admin/services/communityFeedAdminService';

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const service = new AdminCommunityFeedService();
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
    const messages = await service.getAllWithDetails(limit);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching community feed messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

