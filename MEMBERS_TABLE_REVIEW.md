# Members Table Schema Review & Improvements

## Current State

The members table currently contains minimal fields:
- `id` (UUID, references auth.users)
- `email` (TEXT, NOT NULL)
- `name` (TEXT)
- `avatar_url` (TEXT)
- `role` (ENUM: 'general', 'investor', 'admin')
- `created_at`, `updated_at` (timestamps)

## Issues with Current Schema

1. **Lacks Professional Context**: No company, job title, or professional bio
2. **No Geographic Focus**: Missing location data critical for a Minnesota-focused platform
3. **No Real Estate Specialization**: Missing property types, investment focus, service offerings
4. **No Professional Credentials**: No way to track licenses, certifications
5. **No Visibility Controls**: All profiles are public with no privacy options
6. **No Activity Tracking**: Missing engagement metrics
7. **Limited Member Types**: Only has role (general/investor/admin), not professional type

## Improvements Made

### 1. Professional Information
- `company` - Company or organization name
- `job_title` - Professional job title or role
- `bio` - Professional biography (max 2000 characters)
- `website` - Professional website URL
- `linkedin_url` - LinkedIn profile URL
- `phone` - Contact phone number

### 2. Geographic Information (Minnesota-Focused)
- `city` - City in Minnesota
- `state` - State (constrained to 'MN' for platform focus)
- `zip_code` - ZIP code
- `primary_market_area` - Primary market area (e.g., "Twin Cities", "Duluth", "Rochester")

### 3. Real Estate Professional Classification
- `member_type` (ENUM) - Type of real estate professional:
  - `developer` - Real estate developer
  - `investor` - Real estate investor
  - `agent` - Real estate agent
  - `contractor` - General contractor
  - `lender` - Lender/financial services
  - `attorney` - Real estate attorney
  - `consultant` - Real estate consultant
  - `service_provider` - Other service provider
  - `general` - General member (default)

### 4. Property Focus
- `property_focuses` (ARRAY) - Array of property types member focuses on:
  - `residential` - Residential properties
  - `commercial` - Commercial properties
  - `mixed_use` - Mixed-use development
  - `land` - Land acquisition
  - `industrial` - Industrial properties
  - `multi_family` - Multi-family properties
  - `single_family` - Single-family homes
  - `condo` - Condominiums
  - `all` - All property types

### 5. Investment Capacity
- `investment_capacity` (ENUM) - Investment capacity range:
  - `under_100k` - Under $100,000
  - `100k_500k` - $100,000 - $500,000
  - `500k_1m` - $500,000 - $1,000,000
  - `1m_5m` - $1,000,000 - $5,000,000
  - `5m_10m` - $5,000,000 - $10,000,000
  - `10m_plus` - $10,000,000+
  - `not_applicable` - Not applicable (for non-investors)

### 6. Service Offerings
- `service_offerings` (JSONB) - Flexible JSONB array of services offered
  - Example: `["Property Management", "Construction", "Legal Services", "Property Inspection"]`

### 7. Professional Credentials
- `licenses` (TEXT[]) - Array of professional licenses
  - Example: `["MN Real Estate License #12345", "General Contractor License #67890"]`
- `certifications` (TEXT[]) - Array of professional certifications
  - Example: `["LEED Certified", "Certified Property Manager", "CCIM"]`

### 8. Visibility & Privacy
- `profile_visibility` (ENUM) - Who can view this profile:
  - `public` - Visible to all authenticated users (default)
  - `members_only` - Visible to authenticated members only
  - `private` - Visible only to the member themselves

### 9. Verification & Trust
- `is_verified` (BOOLEAN) - Whether member account has been verified
- `verified_at` (TIMESTAMP) - When verification occurred

### 10. Activity Tracking
- `last_active_at` (TIMESTAMP) - Last activity timestamp for engagement tracking
- `total_listings` (INTEGER) - Total number of marketplace listings created
- `total_pins` (INTEGER) - Total number of map pins created

## Indexes Added

Performance indexes created for:
- `member_type` - Filter by professional type
- `city` - Filter by city
- `primary_market_area` - Filter by market area
- `property_focuses` (GIN) - Efficient array searches
- `investment_capacity` - Filter by investment capacity
- `is_verified` - Filter verified members
- `profile_visibility` - Filter by visibility
- `last_active_at` - Sort by activity

## RLS Policy Updates

Updated Row Level Security to respect `profile_visibility`:
- **Public profiles**: Visible to all authenticated users
- **Members-only profiles**: Visible to authenticated members
- **Private profiles**: Visible only to the member themselves
- **Own profile**: Always visible to the member

## Alignment with MNUDA Platform Goals

These improvements align with the Minnesota Platform for Under Development & Acquisition by:

1. **Professional Networking**: Company, job title, bio, and credentials enable professional connections
2. **Geographic Focus**: City, state, and primary market area support Minnesota-specific networking
3. **Property Matching**: Property focuses and investment capacity help match developers with investors
4. **Service Discovery**: Service offerings help members find contractors, attorneys, lenders, etc.
5. **Trust Building**: Verification status and credentials build trust in the platform
6. **Privacy Control**: Visibility settings give members control over their information
7. **Engagement Tracking**: Activity metrics help identify active members

## Migration Files

1. `20250130_enhance_members_table.sql` - Adds all new columns, enums, indexes, and updates trigger function
2. `20250130_update_members_rls_for_visibility.sql` - Updates RLS policies to respect profile_visibility

## Backward Compatibility

- All new columns are nullable or have defaults
- Existing member records remain valid
- `handle_new_user()` function updated with new defaults
- No breaking changes to existing queries

## Next Steps

1. Update TypeScript types (`src/types/supabase.ts`)
2. Update member service (`src/features/auth/services/memberService.ts`)
3. Update settings page to include new fields
4. Add member profile pages with professional information
5. Implement member search/filtering by type, location, property focus
6. Add verification workflow for professional credentials

