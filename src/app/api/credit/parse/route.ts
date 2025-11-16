import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CreditReportParser } from '@/features/credit/services/creditReportParser';

/**
 * API endpoint to parse credit reports
 * 
 * POST /api/credit/parse
 * Body: {
 *   creditProfileId: string,
 *   reportUrl: string,
 *   bureau: 'experian' | 'equifax' | 'transunion',
 *   method?: 'manual' | 'ai' | 'hybrid'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { creditProfileId, reportUrl, bureau, method = 'hybrid' } = await request.json();

    if (!creditProfileId || !reportUrl || !bureau) {
      return NextResponse.json(
        { error: 'Missing required fields: creditProfileId, reportUrl, bureau' },
        { status: 400 }
      );
    }

    // Verify user owns the profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creditProfile } = await supabase
      .from('credit_profiles')
      .select('member_id')
      .eq('id', creditProfileId)
      .single();

    if (!creditProfile || creditProfile.member_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse the credit report
    const parsedReport = await CreditReportParser.parseReport(
      reportUrl,
      bureau,
      creditProfileId,
      method
    );

    return NextResponse.json({
      success: true,
      data: parsedReport,
    });
  } catch (error) {
    console.error('Error parsing credit report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse credit report' },
      { status: 500 }
    );
  }
}

