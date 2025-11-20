import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const service = new AdminAdService();
    const ad = await service.approve(id);

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error approving ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve ad' },
      { status: 500 }
    );
  }
}

