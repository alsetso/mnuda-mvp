import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminPinService } from '@/features/admin/services/pinAdminService';

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const service = new AdminPinService();
    const pins = await service.getAllWithDetails();

    return NextResponse.json(pins);
  } catch (error) {
    console.error('Error fetching pins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pins' },
      { status: 500 }
    );
  }
}

