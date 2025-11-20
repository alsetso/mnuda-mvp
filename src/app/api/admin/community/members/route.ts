import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminMemberService } from '@/features/admin/services/memberAdminService';

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const service = new AdminMemberService();
    const members = await service.getAllMembers();

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

