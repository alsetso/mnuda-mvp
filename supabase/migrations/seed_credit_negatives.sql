-- Seed credit_negatives for a specific member_id
-- Replace 'YOUR_MEMBER_ID_HERE' with the actual member_id UUID

-- Get credit_profile_id for the member
WITH profile_lookup AS (
  SELECT id AS credit_profile_id
  FROM public.credit_profiles
  WHERE member_id = 'YOUR_MEMBER_ID_HERE'::UUID
)
INSERT INTO public.credit_negatives (
  credit_profile_id,
  bureau,
  item_type,
  item_subtype,
  item_status,
  creditor_name,
  balance_amount,
  is_paid,
  parsing_method,
  review_status
)
SELECT 
  pl.credit_profile_id,
  bureau_value,
  item_type_value,
  item_subtype_value,
  item_status_value,
  creditor_name_value,
  balance_value,
  is_paid_value,
  'manual'::TEXT,
  'pending'::TEXT
FROM profile_lookup pl
CROSS JOIN LATERAL (
  VALUES
    -- Blaze Credit Union - Charge-Off - $1,949 - EQ, TU
    ('equifax', 'CHARGE_OFF'::negative_item_type, NULL::negative_item_subtype, 'CHARGE_OFF'::negative_item_status, 'Blaze Credit Union', 1949.00, false),
    ('transunion', 'CHARGE_OFF'::negative_item_type, NULL::negative_item_subtype, 'CHARGE_OFF'::negative_item_status, 'Blaze Credit Union', 1949.00, false),
    
    -- National Credit Systems - Collection - Unpaid - $457 - EQ, TU
    ('equifax', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'National Credit Systems', 457.00, false),
    ('transunion', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'National Credit Systems', 457.00, false),
    
    -- Caine & Weiner - Collection - Unpaid - $389 - EQ, TU
    ('equifax', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'Caine & Weiner', 389.00, false),
    ('transunion', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'Caine & Weiner', 389.00, false),
    
    -- Credence Resource Mgmt - Collection - Unpaid - $207 - EQ, TU, EX
    ('equifax', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'Credence Resource Mgmt', 207.00, false),
    ('transunion', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'Credence Resource Mgmt', 207.00, false),
    ('experian', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'Credence Resource Mgmt', 207.00, false),
    
    -- LVNV Funding - Collection - Unpaid - $71 - TU
    ('transunion', 'COLLECTION'::negative_item_type, 'UNPAID_COLLECTION'::negative_item_subtype, 'COLLECTION'::negative_item_status, 'LVNV Funding', 71.00, false),
    
    -- SPIRE Credit Union - Late Payments + Past Due - 150-30 days late - $1,949 - EX
    ('experian', 'LATE_PAYMENT'::negative_item_type, 'LATE_150'::negative_item_subtype, 'PAST_DUE'::negative_item_status, 'SPIRE Credit Union', 1949.00, false),
    
    -- Capital One - Late Payments - Paid, Closed - $0 - EX, TU
    ('experian', 'LATE_PAYMENT'::negative_item_type, 'PATTERN_LATE_PAYMENTS'::negative_item_subtype, 'PAID_LATE'::negative_item_status, 'Capital One', 0.00, true),
    ('transunion', 'LATE_PAYMENT'::negative_item_type, 'PATTERN_LATE_PAYMENTS'::negative_item_subtype, 'PAID_LATE'::negative_item_status, 'Capital One', 0.00, true)
) AS data(
  bureau_value,
  item_type_value,
  item_subtype_value,
  item_status_value,
  creditor_name_value,
  balance_value,
  is_paid_value
)
WHERE pl.credit_profile_id IS NOT NULL;



