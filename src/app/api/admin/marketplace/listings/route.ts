import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminListingService } from '@/features/admin/services/listingAdminService';

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const service = new AdminListingService();
    const listings = await service.getAllWithDetails();
    
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

