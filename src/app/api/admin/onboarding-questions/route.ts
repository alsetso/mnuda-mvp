import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { OnboardingQuestionAdminService } from '@/features/admin/services/onboardingQuestionAdminService';

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const service = new OnboardingQuestionAdminService();
    const grouped = await service.getAllGroupedByProfileType();
    
    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching onboarding questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const body = await request.json();
    const service = new OnboardingQuestionAdminService();
    const question = await service.create(body);
    
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating onboarding question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create question' },
      { status: 500 }
    );
  }
}

