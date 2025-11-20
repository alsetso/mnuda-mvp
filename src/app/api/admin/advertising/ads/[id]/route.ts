import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';
import { UpdateAdData } from '@/features/ads/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const service = new AdminAdService();
    const ad = await service.getByIdWithDetails(id);

    if (!ad) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error fetching ad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const body: UpdateAdData = await request.json();

    const service = new AdminAdService();
    const ad = await service.update(id, body);

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ad' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const service = new AdminAdService();
    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete ad' },
      { status: 500 }
    );
  }
}

