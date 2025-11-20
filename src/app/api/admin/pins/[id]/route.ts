import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminPinService } from '@/features/admin/services/pinAdminService';
import { UpdatePinData } from '@/features/pins/services/pinService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const service = new AdminPinService();
    const pin = await service.getByIdWithDetails(id);

    if (!pin) {
      return NextResponse.json(
        { error: 'Pin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pin);
  } catch (error) {
    console.error('Error fetching pin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pin' },
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
    const body: UpdatePinData = await request.json();

    const service = new AdminPinService();
    const pin = await service.update(id, body);

    return NextResponse.json(pin);
  } catch (error) {
    console.error('Error updating pin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update pin' },
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
    const service = new AdminPinService();
    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete pin' },
      { status: 500 }
    );
  }
}

