# Group Approval System - Alternatives to Intake Questions

## Current Implementation: Intake Questions

The system supports up to 3 customizable intake questions that group owners can configure. When users request to join a group with `requires_approval=true`, they answer these questions, and owners review responses before approving/denying.

## Alternative Approaches

### 1. **Manual Review Only (Simplest)**
**How it works:**
- Group owner enables `requires_approval`
- Users click "Request to Join" → creates pending membership
- Owner reviews user profile (name, avatar, basic info) and approves/denies
- No questions required

**Pros:**
- Simplest implementation
- Fast for users (one click)
- Owners can make decisions based on profile

**Cons:**
- Limited information for decision-making
- May need to check external profiles (LinkedIn, etc.)

**Implementation:**
- Remove intake questions requirement
- `joinGroup()` creates pending membership
- Owner reviews in pending members list

---

### 2. **Profile-Based Auto-Approval**
**How it works:**
- Group owner sets criteria (location, role, company, etc.)
- System auto-approves if user matches criteria
- Otherwise, goes to pending for manual review

**Pros:**
- Reduces owner workload
- Fast approval for qualified users
- Still allows manual review for edge cases

**Cons:**
- More complex implementation
- Requires profile data standardization
- May miss good candidates who don't match criteria

**Implementation:**
```typescript
// Add to groups table
ALTER TABLE groups ADD COLUMN auto_approval_criteria JSONB;

// Example criteria
{
  "location": ["San Francisco", "New York"],
  "role": ["investor", "developer"],
  "min_profile_completeness": 0.7
}
```

---

### 3. **Simple Checkbox Agreements**
**How it works:**
- Group owner creates up to 3 checkbox statements (e.g., "I agree to code of conduct")
- Users check boxes during join
- No text responses needed
- Owner can still review before approval

**Pros:**
- Faster than text questions
- Ensures users read/agree to terms
- Less data to review

**Cons:**
- Less informative than open-ended questions
- Users might not read carefully

**Implementation:**
- Similar to intake questions but boolean responses
- `group_intake_questions` table with `is_checkbox: boolean`
- `group_intake_responses` stores `agreed: boolean`

---

### 4. **Invitation-Only (Bring Back)**
**How it works:**
- Group visibility: `invite_only`
- Only invited users can join
- Owner sends invitations via email/link
- Invited users auto-approved on join

**Pros:**
- Highest quality control
- No approval queue needed
- Users feel exclusive

**Cons:**
- Requires invitation system
- Less discoverable
- More work for owners to grow group

**Implementation:**
- Re-add `invite_only` to `group_visibility` enum
- Create `group_invitations` table
- Invitation links contain token for auto-approval

---

### 5. **Hybrid: Questions + Auto-Approval Rules**
**How it works:**
- Owner sets intake questions AND auto-approval rules
- If responses match rules → auto-approved
- Otherwise → pending for review

**Example rules:**
- "If 'Why do you want to join?' contains 'real estate' → approve"
- "If 'Experience level?' is 'expert' → approve"
- "Otherwise → pending"

**Pros:**
- Best of both worlds
- Reduces manual review
- Still captures information

**Cons:**
- Most complex implementation
- Requires rule engine
- May need ML for text matching

---

## Recommendation

**For MVP: Manual Review Only (#1)**

1. Simplest to implement
2. Fastest user experience
3. Owners can still make informed decisions
4. Can add intake questions later if needed

**For Future: Hybrid Approach (#5)**

1. Start with manual review
2. Add intake questions as optional
3. Add auto-approval rules later
4. Gives owners flexibility

---

## Migration Path

If you want to switch from intake questions to manual review:

1. Make `requires_approval` work without questions
2. Keep intake questions optional (can be added later)
3. Update UI to show "Request to Join" instead of form
4. Owners review pending members with profile info only

