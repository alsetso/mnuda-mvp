# Skip Trace API Parser Fix

## Problem Identified

The skip trace person details were not displaying in the UI because the parser (`skipTracePersonParser.ts`) was looking for the **wrong key names** in the API response.

## Root Cause

The Person Details API (`https://skip-tracing-working-api.p.rapidapi.com/search/detailsbyID`) returns data with **keys that have spaces and Pascal casing**, but the parser was looking for camelCase keys without spaces.

### Actual API Response Structure (from personDetailParse.ts)
```typescript
{
  "Person Details": [...],           // NOT personDetails or PersonDetails
  "Email Addresses": [...],          // NOT emails or Emails
  "All Phone Details": [...],        // NOT phones or Phones
  "Current Address Details List": [...], // NOT currentAddresses
  "Previous Address Details": [...], // NOT previousAddresses
  "All Relatives": [...],            // NOT relatives
  "All Associates": [...],           // NOT associates
  "Source": "...",                   // Capital S
}
```

### What the Parser Was Looking For (WRONG)
```typescript
{
  personDetails: [...],    // ❌ Wrong
  emails: [...],           // ❌ Wrong
  phones: [...],           // ❌ Wrong
  currentAddresses: [...], // ❌ Wrong
  previousAddresses: [...],// ❌ Wrong
  relatives: [...],        // ❌ Wrong
  associates: [...],       // ❌ Wrong
}
```

## Solution Applied

Updated `src/features/api/services/skipTracePersonParser.ts` to:

1. **Look for correct API keys first** (with spaces and Pascal case)
2. **Fallback to alternative naming conventions** for flexibility
3. **Validate arrays before processing** to prevent errors
4. **Filter out empty results** to avoid displaying blank sections
5. **Handle null/undefined values properly**

### Key Changes

#### Main Response Parsing
```typescript
// Before:
personDetails: this.parsePersonDetails(
  (response.personDetails as unknown[]) || 
  (response.PersonDetails as unknown[]) || 
  []
),

// After (CORRECT):
personDetails: this.parsePersonDetails(
  (response['Person Details'] as unknown[]) ||  // ✅ Correct API key
  (response.PersonDetails as unknown[]) ||       // Fallback
  (response.personDetails as unknown[]) ||       // Fallback
  []
),
```

#### Field Name Parsing
```typescript
// Before:
age: get('age') || get('Age'),

// After (CORRECT):
age: get('Age') || get('age'),  // ✅ Check Pascal case first
```

## API Response Field Mappings

| Data Type | API Response Key | Parser Looks For (in order) |
|-----------|------------------|------------------------------|
| Person Details | `"Person Details"` | `Person Details` → `PersonDetails` → `personDetails` |
| Emails | `"Email Addresses"` | `Email Addresses` → `EmailAddresses` → `Emails` → `emails` |
| Phones | `"All Phone Details"` | `All Phone Details` → `AllPhoneDetails` → `Phones` → `phones` |
| Current Addresses | `"Current Address Details List"` | `Current Address Details List` → `CurrentAddressDetailsList` → `CurrentAddresses` → `currentAddresses` |
| Previous Addresses | `"Previous Address Details"` | `Previous Address Details` → `PreviousAddressDetails` → `PreviousAddresses` → `previousAddresses` |
| Relatives | `"All Relatives"` | `All Relatives` → `AllRelatives` → `Relatives` → `relatives` |
| Associates | `"All Associates"` | `All Associates` → `AllAssociates` → `Associates` → `associates` |

## Individual Field Mappings

### Person Details Object
```typescript
{
  "Person_name": "...",    // or "Person Name"
  "Age": "...",
  "Born": "...",
  "Lives in": "...",
  "Telephone": "..."
}
```

### Phone Details Object
```typescript
{
  "phone_number": "...",   // Note: snake_case
  "phone_type": "...",
  "last_reported": "...",
  "provider": "..."
}
```

### Address Object (Current)
```typescript
{
  "street_address": "...",    // Note: snake_case
  "address_locality": "...",
  "address_region": "...",
  "postal_code": "...",
  "county": "...",
  "date_range": "..."
}
```

### Address Object (Previous)
```typescript
{
  "streetAddress": "...",     // Note: camelCase (different from current!)
  "addressLocality": "...",
  "addressRegion": "...",
  "postalCode": "...",
  "county": "...",
  "timespan": "..."
}
```

### Relative/Associate Object
```typescript
{
  "Name": "...",
  "Age": "...",
  "Person ID": "...",        // Note: space in key name
  "Person Link": "..."
}
```

## Validation & Filtering Improvements

1. **Array Validation**: All parsers now check `Array.isArray()` before processing
2. **Empty Filtering**: Results with no meaningful data are filtered out
3. **Null Safety**: All field getters handle `null` and `undefined` properly
4. **Email Validation**: Emails are validated to contain '@' character
5. **Required Fields**: Items without key identifiers (name, phoneNumber, etc.) are filtered

## Testing the Fix

To verify the fix works:

1. Open a property in the workspace
2. Go to the "People" tab
3. Find a person record with a `person_id`
4. Click "Skip Trace" button
5. Wait for the API response
6. Click "Skip Trace Details" dropdown
7. You should now see formatted sections with data (if available in the API response)

## Files Modified

- `/src/features/api/services/skipTracePersonParser.ts` - Complete rewrite of parsing logic

## Files Referenced for API Structure

- `/src/features/api/services/personDetailParse.ts` - Shows actual API structure
- `/src/features/workspaces/components/PropertyDetailOverlay.tsx` - Uses the parser

## Notes

- The API inconsistently uses different casing conventions (Pascal, camel, snake_case)
- Current addresses use `snake_case` while previous addresses use `camelCase`
- Many keys contain spaces, requiring bracket notation to access
- The parser now handles all known variations to maximize compatibility

