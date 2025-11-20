import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { OnboardingQuestionAdminService } from '@/features/admin/services/onboardingQuestionAdminService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const service = new OnboardingQuestionAdminService();
    const question = await service.getById(questionId);
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching onboarding question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch question' },
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
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const service = new OnboardingQuestionAdminService();
    const question = await service.update(questionId, body);
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating onboarding question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = await requireAdminApiAccess(request);
    if (response) return response;

    const { id } = await params;
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const service = new OnboardingQuestionAdminService();
    await service.delete(questionId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting onboarding question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete question' },
      { status: 500 }
    );
  }
}

