import { NextRequest, NextResponse } from 'next/server';

/**
 * AI-powered credit report parsing endpoint
 * 
 * This endpoint uses AI (OpenAI GPT-4 or similar) to parse credit report text
 * and extract structured negative items.
 * 
 * POST /api/credit/parse-ai
 * Body: {
 *   text: string,
 *   bureau: 'experian' | 'equifax' | 'transunion'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { text, bureau } = await request.json();

    if (!text || !bureau) {
      return NextResponse.json(
        { error: 'Missing required fields: text, bureau' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Use OpenAI to parse the credit report
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert credit report parser. Extract all negative items from the credit report text and return them as a JSON array. 
            
            For each negative item, identify:
            - itemType: One of LATE_PAYMENT, COLLECTION, CHARGE_OFF, REPOSSESSION, FORECLOSURE, BANKRUPTCY, PUBLIC_RECORD, TAX_LIEN, CIVIL_JUDGMENT, SETTLEMENT, DELINQUENCY, DEROGATORY_TRADELINE, CLOSED_BY_GRANTOR, VOLUNTARY_SURRENDER, PAID_CHARGE_OFF, PAID_COLLECTION, INQUIRY, FRAUD_FLAG, IDENTITY_FLAG
            - itemSubtype: More specific classification (e.g., LATE_30, LATE_60, MEDICAL_COLLECTION, etc.)
            - itemStatus: Current status (DEROGATORY, PAID, COLLECTION, etc.)
            - accountName, accountNumber, creditorName, dates, amounts, etc.
            - complianceViolations: Any FCRA violations found
            
            Return only valid JSON array of items.`,
          },
          {
            role: 'user',
            content: `Parse this ${bureau} credit report and extract all negative items:\n\n${text.substring(0, 100000)}`, // Limit text length
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for consistent parsing
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const parsedContent = JSON.parse(data.choices[0].message.content);
    const items = parsedContent.items || [];

    return NextResponse.json({
      success: true,
      items: items.map((item: any) => ({
        ...item,
        confidenceScore: 0.9, // AI parsing has high confidence
      })),
    });
  } catch (error) {
    console.error('AI parsing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse with AI' },
      { status: 500 }
    );
  }
}

