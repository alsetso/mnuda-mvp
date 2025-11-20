import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminBusinessService } from '@/features/admin/services/businessAdminService';
import { UpdateBusinessData } from '@/features/business/services/businessService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const { id } = await params;
    const service = new AdminBusinessService();
    const business = await service.getByIdWithDetails(id);
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const { id } = await params;
    const body: UpdateBusinessData = await request.json();
    const service = new AdminBusinessService();
    const business = await service.update(id, body);
    
    return NextResponse.json(business);
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update business' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const { id } = await params;
    const service = new AdminBusinessService();
    await service.delete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete business' },
      { status: 500 }
    );
  }
}

