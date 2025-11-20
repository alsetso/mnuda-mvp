import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminAdService } from '@/features/admin/services/adAdminService';

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const service = new AdminAdService();
    const ads = await service.getAllWithDetails();

    return NextResponse.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

