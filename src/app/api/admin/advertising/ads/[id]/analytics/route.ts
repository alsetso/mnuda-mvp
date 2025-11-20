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
    const days = parseInt(searchParams.get('days') || '30', 10);

    const service = new AdminAdService();
    const analytics = await service.getAnalytics(id, days);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching ad analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

