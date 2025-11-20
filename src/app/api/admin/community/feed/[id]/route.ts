import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminHelpers';
import { AdminCommunityFeedService } from '@/features/admin/services/communityFeedAdminService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await requireAdminApiAccess(request);
  if (response) return response;

  try {
    const { id } = await params;
    const service = new AdminCommunityFeedService();
    await service.deleteMessage(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting community feed message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete message' },
      { status: 500 }
    );
  }
}

