# Credit Report Parsing System

## Overview

The credit parsing system extracts and classifies negative items from credit reports (PDFs) using a combination of AI and manual parsing methods. All items are classified using the comprehensive enum system.

## Architecture

### 1. Database Schema

**Tables:**
- `credit_restoration_requests` - Stores user requests and report URLs
- `negative_items` - Stores parsed negative items with full classification

**Enums:**
- `negative_item_type` - Main categories (LATE_PAYMENT, COLLECTION, etc.)
- `negative_item_subtype` - Specific subtypes (LATE_30, MEDICAL_COLLECTION, etc.)
- `negative_item_status` - Current status (DEROGATORY, PAID, etc.)
- `compliance_violation_type` - FCRA violations (WRONG_DATE_OPENED, etc.)

### 2. Parsing Methods

#### Hybrid Parsing (Recommended)
Combines AI and manual parsing:
1. **AI Parsing** - Uses GPT-4 to extract items with high confidence
2. **Manual Parsing** - Uses regex patterns to catch items AI might miss
3. **Merge** - Combines results, prioritizing manual for conflicts

#### AI-Only Parsing
- Fast and comprehensive
- Uses OpenAI GPT-4 with structured output
- High confidence scores (0.9+)
- Best for standard report formats

#### Manual-Only Parsing
- Uses regex patterns specific to each bureau
- Lower confidence scores (0.7)
- Good for verification or when AI is unavailable

### 3. Workflow

```
1. User uploads credit reports
   ↓
2. Reports stored in Supabase storage
   ↓
3. Credit restoration request created
   ↓
4. Parsing triggered automatically (async)
   ↓
5. For each report:
   a. Extract text from PDF
   b. Parse with AI (if enabled)
   c. Parse with manual patterns
   d. Merge results
   e. Classify items using enums
   f. Store in negative_items table
   ↓
6. Items available for review and dispute
```

## Usage

### Automatic Parsing (After Submission)

When a user submits a credit restoration request, parsing is automatically triggered:

```typescript
const requestId = await CreditRestorationService.submitRestorationRequest(request);
// Parsing happens automatically in the background
```

### Manual Parsing

```typescript
import { CreditReportParser } from '@/features/credit/services/creditReportParser';

const parsedReport = await CreditReportParser.parseReport(
  reportUrl,
  'experian',
  requestId,
  'hybrid' // or 'ai' or 'manual'
);
```

### API Endpoint

```bash
POST /api/credit/parse
{
  "requestId": "uuid",
  "reportUrl": "https://...",
  "bureau": "experian",
  "method": "hybrid"
}
```

## Classification Logic

### Item Type Detection

The parser identifies item types using:
- **Keywords** - "collection", "charge off", "bankruptcy"
- **Patterns** - Account status codes, payment history
- **Context** - Surrounding text and account details

### Subtype Classification

Subtypes are determined by:
- **LATE_PAYMENT** → Days late (30, 60, 90, etc.)
- **COLLECTION** → Collection type (medical, utility, etc.)
- **BANKRUPTCY** → Chapter number (7, 13, etc.)
- **Status** → Paid vs unpaid, settled, etc.

### Status Classification

Status is determined by:
- Payment status (paid, unpaid, settled)
- Account status (open, closed, charged off)
- Dispute status (disputed, resolved)
- Bankruptcy status (filed, discharged, dismissed)

## Compliance Violations

The parser also identifies FCRA violations:
- **Date Errors** - Wrong dates (opened, reported, DOFD)
- **Reaging** - Incorrect date of first delinquency
- **Duplicates** - Same account reported multiple times
- **Expired Items** - Items past 7-year reporting limit
- **Discharge Violations** - Reporting after bankruptcy discharge

## Manual Review

All parsed items are marked as `review_status: 'pending'` and require:
1. **Verification** - Confirm accuracy of parsed data
2. **Classification Review** - Verify enum classifications
3. **Compliance Check** - Identify violations
4. **Dispute Preparation** - Prepare dispute letters

## AI Integration

### OpenAI GPT-4

The system uses GPT-4 with:
- **Structured Output** - JSON format for consistent parsing
- **Low Temperature** (0.1) - Consistent results
- **System Prompt** - Expert credit report parser persona
- **Context** - Full report text (up to 100k characters)

### Alternative AI Options

You can also use:
- **Claude (Anthropic)** - Similar capabilities
- **Specialized APIs** - Credit report parsing services
- **Fine-tuned Models** - Custom models trained on credit reports

## Extending the Parser

### Adding New Patterns

Edit `creditReportParser.ts`:

```typescript
private static getParsingPatterns(bureau: string) {
  return [
    {
      type: 'NEW_ITEM_TYPE' as const,
      regex: /pattern to match/gi,
      extractors: {
        field1: /extract field1/i,
        field2: /extract field2/i,
      },
    },
    // ... more patterns
  ];
}
```

### Adding Classification Logic

```typescript
private static classifySubtype(item: NegativeItem): string | null {
  if (item.itemType === 'NEW_TYPE') {
    // Add classification logic
    return 'NEW_SUBTYPE';
  }
  return null;
}
```

## Performance

- **Parsing Time**: ~30-60 seconds per report (AI) or ~5-10 seconds (manual)
- **Storage**: ~1-5KB per negative item
- **API Costs**: ~$0.01-0.05 per report (GPT-4)

## Error Handling

- **PDF Extraction Failures** - Falls back to manual parsing
- **AI API Failures** - Falls back to manual parsing
- **Classification Errors** - Items marked with low confidence for review
- **Storage Failures** - Retry logic with exponential backoff

## Future Enhancements

1. **Bureau-Specific Parsers** - Optimized for each bureau's format
2. **OCR for Scanned PDFs** - Handle image-based reports
3. **Machine Learning** - Train custom models on historical data
4. **Real-time Updates** - Parse as reports are uploaded
5. **Batch Processing** - Process multiple reports in parallel

