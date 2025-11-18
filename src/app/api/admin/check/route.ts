import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/authServer';

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    return NextResponse.json({ 
      isAdmin: true, 
      admin: {
        id: auth.id,
        email: auth.email,
        name: auth.name,
      }
    });
  } catch (error) {
    console.error('Error checking admin access:', error);
    return NextResponse.json(
      { error: 'Failed to check admin access' },
      { status: 500 }
    );
  }
}

