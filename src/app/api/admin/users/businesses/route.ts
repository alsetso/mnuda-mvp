import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminBusinessService } from '@/features/admin/services/businessAdminService';

export async function GET(request: NextRequest) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const service = new AdminBusinessService();
    const businesses = await service.getAllWithDetails();
    
    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

