import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminMemberService } from '@/features/admin/services/memberAdminService';
import { MemberRole } from '@/features/auth/services/memberService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const body: { role: MemberRole } = await request.json();

    if (!body.role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    const validRoles: MemberRole[] = ['general', 'investor', 'admin'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const service = new AdminMemberService();
    const member = await service.updateRole(id, body.role);

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member role' },
      { status: 500 }
    );
  }
}

