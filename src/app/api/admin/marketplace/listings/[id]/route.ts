import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminListingService } from '@/features/admin/services/listingAdminService';
import { UpdateListingData } from '@/features/marketplace/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const { id } = await params;
    const service = new AdminListingService();
    const listing = await service.getByIdWithDetails(id);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching marketplace listing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listing' },
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
    const body: UpdateListingData = await request.json();
    const service = new AdminListingService();
    const listing = await service.update(id, body);
    
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error updating marketplace listing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update listing' },
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
    const service = new AdminListingService();
    await service.delete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketplace listing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete listing' },
      { status: 500 }
    );
  }
}

