import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminMemberService } from '@/features/admin/services/memberAdminService';
import { UpdateMemberData } from '@/features/auth/services/memberService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const service = new AdminMemberService();
    const member = await service.getById(id);

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
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
    const body: UpdateMemberData = await request.json();

    // Don't allow role updates through this endpoint - use the role endpoint
    if (body.role !== undefined) {
      return NextResponse.json(
        { error: 'Role cannot be updated through this endpoint. Use /role endpoint instead.' },
        { status: 400 }
      );
    }

    const service = new AdminMemberService();
    const member = await service.update(id, body);

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    );
  }
}

