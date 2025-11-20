import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminListingService } from '@/features/admin/services/listingAdminService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const { id } = await params;
    const service = new AdminListingService();
    const listing = await service.approve(id);
    
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error approving marketplace listing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve listing' },
      { status: 500 }
    );
  }
}

