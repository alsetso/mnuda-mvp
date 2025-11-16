# Credit System: Current vs Requested Implementation

## Table Structure Comparison

### Current Implementation

#### 1. `credit_restoration_requests`
- **Purpose**: Stores user identity details and credit report URLs
- **Key Fields**:
  - `id` (UUID)
  - `user_id` (UUID) → References `auth.users(id)`
  - `identity_details` (JSONB) - Contains personal information
  - `experian_report_url`, `equifax_report_url`, `transunion_report_url` (TEXT)
  - `status` (TEXT) - pending, in_progress, completed, cancelled
- **Relationship**: Direct link to `auth.users`, not `members`

#### 2. `negative_items`
- **Purpose**: Stores parsed negative credit items from reports
- **Key Fields**:
  - `id` (UUID)
  - `credit_restoration_request_id` (UUID) → References `credit_restoration_requests(id)`
  - `bureau` (TEXT) - experian, equifax, transunion
  - Extensive classification fields (item_type, item_status, dates, amounts, compliance violations)
- **Relationship**: Links to `credit_restoration_requests`, not directly to user

#### 3. Storage Bucket: `credit-reports`
- **Purpose**: Stores PDF credit reports
- **Structure**: Files stored in `{user_id}/{filename}` format
- **No database table** for tracking reports separately

#### 4. Missing Tables
- ❌ `credit_profiles` - Does not exist
- ❌ `credit_reports` (table) - Does not exist
- ❌ `credit_letters` - Does not exist

---

### Requested Implementation

#### 1. `credit_profiles`
- **Purpose**: Personal information of persons, connected to `member_id`
- **Expected Structure**:
  - `id` (UUID)
  - `member_id` (UUID) → References `members(id)` (NOT `auth.users`)
  - Personal information fields (likely similar to current `identity_details` JSONB)
- **Relationship**: Links to `members` table, not `auth.users`

#### 2. `credit_reports`
- **Purpose**: Physical documents (Experian, Transunion, Equifax) and storage bucket references
- **Expected Structure**:
  - `id` (UUID)
  - `credit_profile_id` (UUID) → References `credit_profiles(id)`
  - `bureau` (TEXT) - experian, equifax, transunion
  - `storage_path` or `file_url` (TEXT)
  - `uploaded_at` (TIMESTAMP)
  - Metadata fields
- **Relationship**: Links to `credit_profiles`, not `credit_restoration_requests`

#### 3. `credit_negatives`
- **Purpose**: Negative remarks (equivalent to current `negative_items`)
- **Expected Structure**:
  - Similar to current `negative_items` but likely links to `credit_profiles` or `credit_reports`
- **Relationship**: Should link to `credit_profiles` or `credit_reports`

#### 4. `credit_letters`
- **Purpose**: Letters sent/received to bureaus
- **Expected Structure**:
  - `id` (UUID)
  - `credit_profile_id` (UUID) → References `credit_profiles(id)`
  - `bureau` (TEXT) - experian, equifax, transunion
  - `letter_type` (TEXT) - sent, received
  - `content` or `file_url` (TEXT)
  - `sent_at` / `received_at` (TIMESTAMP)
  - Status fields
- **Relationship**: Links to `credit_profiles`

---

## Page Structure Comparison

### Current Implementation

#### `/credit` Page (`src/app/credit/page.tsx`)
- **Current Behavior**:
  - Checks if user is authenticated
  - Loads `credit_restoration_requests` for user
  - If no requests: Shows empty state with "Start Credit Restoration" button → routes to `/repair`
  - If requests exist: Shows `CreditRestorationDashboard` component
- **No stepper form** on this page
- **No profile existence check** - checks for requests, not profiles
- **Routing**: Goes to `/repair` for new users, not `/credit/dashboard`

#### `/credit/dashboard` Page (`src/app/credit/dashboard/page.tsx`)
- **Current Behavior**: 
  - Simply redirects to `/credit`
  - Not a functional dashboard route

#### `/repair` Page (`src/app/repair/page.tsx`)
- **Current Behavior**:
  - Shows `CreditRestorationWorkflow` stepper form
  - Contains identity details step + 3 report upload steps + review step
  - Creates `credit_restoration_requests` records

---

### Requested Implementation

#### `/credit` Page
- **Expected Behavior**:
  - Hero-style bold landing page
  - Lead generation stepper form for `credit_profiles`
  - Checks **once** if `credit_profile` exists for current user
  - If profile exists → routes to `/credit/dashboard`
  - If no profile → shows stepper form to create profile
- **Key Difference**: Profile-based, not request-based

#### `/credit/dashboard` Page
- **Expected Behavior**:
  - **Sidebar** (left):
    - Profile status
    - Reports list
    - Negatives list
    - Letters list
  - **Main Content** (right):
    - Detailed view of selected item
  - **Access Control**: Only accessible to members with a `credit_profiles` record
- **Key Difference**: Functional dashboard with sidebar navigation

---

## Key Architectural Differences

### 1. User Identity Model
- **Current**: Uses `auth.users(id)` directly (`user_id` in `credit_restoration_requests`)
- **Requested**: Uses `members(id)` (`member_id` in `credit_profiles`)
- **Impact**: Requires migration from `user_id` to `member_id` references

### 2. Data Model Hierarchy
- **Current**: 
  ```
  auth.users → credit_restoration_requests → negative_items
  ```
- **Requested**:
  ```
  members → credit_profiles → credit_reports → credit_negatives
                                    ↓
                              credit_letters
  ```
- **Impact**: Flatter structure with profile as central entity

### 3. Reports Storage
- **Current**: URLs stored directly in `credit_restoration_requests` table
- **Requested**: Separate `credit_reports` table with proper relationships
- **Impact**: Better normalization, easier querying and management

### 4. Letters Tracking
- **Current**: No letter tracking system
- **Requested**: Full `credit_letters` table for bureau correspondence
- **Impact**: New feature requiring complete implementation

### 5. Profile vs Request Concept
- **Current**: Request-based (multiple requests per user)
- **Requested**: Profile-based (one profile per member, multiple reports/items/letters)
- **Impact**: Fundamental shift from request-centric to profile-centric model

---

## Migration Requirements

### Database Migrations Needed

1. **Create `credit_profiles` table**
   - Link to `members(id)` not `auth.users(id)`
   - Migrate data from `credit_restoration_requests.identity_details` JSONB to structured columns
   - Ensure one profile per member

2. **Create `credit_reports` table**
   - Link to `credit_profiles(id)`
   - Migrate report URLs from `credit_restoration_requests` to individual report records
   - Add proper metadata fields

3. **Rename/Migrate `negative_items` → `credit_negatives`**
   - Change foreign key from `credit_restoration_request_id` to `credit_profile_id` or `credit_report_id`
   - Update all references

4. **Create `credit_letters` table**
   - New table, no migration needed
   - Link to `credit_profiles(id)`

5. **Deprecate `credit_restoration_requests`**
   - Data migration to new structure
   - Consider keeping for historical records or removing entirely

### Code Updates Needed

1. **Service Layer** (`src/features/credit/services/creditRestorationService.ts`)
   - Update to use `credit_profiles` instead of `credit_restoration_requests`
   - Add methods for `credit_reports`, `credit_letters`
   - Update `getNegativeItems` to use new table structure

2. **Page Components**
   - `/credit`: Add profile existence check, stepper form, route to dashboard
   - `/credit/dashboard`: Build sidebar navigation, main content area
   - Update routing logic throughout

3. **Types** (`src/features/credit/types.ts`)
   - Add `CreditProfile` interface
   - Add `CreditReport` interface
   - Add `CreditLetter` interface
   - Update `NegativeItem` to reference new structure

4. **Components**
   - Create profile stepper form component
   - Update dashboard to show sidebar + main content
   - Add letters management UI

---

## Summary of Gaps

### Missing Tables
- ✅ `credit_profiles` - **NEEDS CREATION**
- ✅ `credit_reports` (table) - **NEEDS CREATION**
- ⚠️ `credit_negatives` - Exists as `negative_items`, **NEEDS RENAME/MIGRATION**
- ✅ `credit_letters` - **NEEDS CREATION**

### Missing Pages/Features
- ✅ `/credit` stepper form - **NEEDS IMPLEMENTATION**
- ✅ `/credit` profile existence check - **NEEDS IMPLEMENTATION**
- ✅ `/credit/dashboard` sidebar navigation - **NEEDS IMPLEMENTATION**
- ✅ `/credit/dashboard` main content area - **NEEDS IMPLEMENTATION**
- ✅ Letters management UI - **NEEDS IMPLEMENTATION**

### Architectural Changes
- ✅ Switch from `user_id` to `member_id` - **NEEDS MIGRATION**
- ✅ Switch from request-based to profile-based model - **NEEDS REFACTOR**
- ✅ Normalize reports into separate table - **NEEDS MIGRATION**

