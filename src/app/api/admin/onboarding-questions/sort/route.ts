import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { OnboardingQuestionAdminService } from '@/features/admin/services/onboardingQuestionAdminService';

export async function PATCH(request: NextRequest) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const body = await request.json();
    const { updates } = body;
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const service = new OnboardingQuestionAdminService(cookieStore);
    await service.updateSortOrders(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sort orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update sort orders' },
      { status: 500 }
    );
  }
}

