import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const service = new AdminAdService();
    const events = await service.getEvents(id, limit);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching ad events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

