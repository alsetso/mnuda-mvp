import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { CountyAdminService } from '@/features/admin/services/countyAdminService';
import { UpdateCountyData } from '@/features/admin/services/countyAdminService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const service = new CountyAdminService();
    const county = await service.getById(id);

    if (!county) {
      return NextResponse.json(
        { error: 'County not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(county);
  } catch (error) {
    console.error('Error fetching county:', error);
    return NextResponse.json(
      { error: 'Failed to fetch county' },
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
    const body: UpdateCountyData = await request.json();

    const service = new CountyAdminService();
    const county = await service.update(id, body);

    return NextResponse.json(county);
  } catch (error) {
    console.error('Error updating county:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update county' },
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
    const service = new CountyAdminService();
    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting county:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete county' },
      { status: 500 }
    );
  }
}



